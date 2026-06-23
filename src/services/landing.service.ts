import { PrismaClient } from "@prisma/client";
import Stripe from "stripe";
import crypto from "crypto";
import { PasswordService } from "./password.service";
import { MailService } from "./mail.service";

// Precios mensuales por plan (en centavos de USD) para Stripe Checkout.
const PRECIOS: Record<string, number> = {
  Starter: 4900,
  Professional: 12900,
};

const ORIGENES = ["CONTACTO", "DEMO", "PLAN", "NEWSLETTER"];

export class LandingService {
  private readonly stripe: Stripe | null;
  private readonly frontendUrl: string;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly passwords: PasswordService,
    private readonly mail: MailService,
    opts: { stripeKey?: string; frontendUrl?: string },
  ) {
    this.stripe = opts.stripeKey ? new Stripe(opts.stripeKey) : null;
    this.frontendUrl = (opts.frontendUrl || "http://localhost:5173").replace(
      /\/$/,
      "",
    );
  }

  private validarEmail(email?: string): string {
    const e = String(email || "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
      throw { status: 400, message: "Correo electrónico no válido" };
    }
    return e.toLowerCase();
  }

  /** Guarda una solicitud de contacto/demo/plan (lead). */
  async crearLead(data: {
    nombre?: string;
    email?: string;
    telefono?: string;
    empresa?: string;
    mensaje?: string;
    origen?: string;
  }) {
    try {
      const nombre = String(data.nombre || "").trim();
      if (nombre.length < 2) {
        throw { status: 400, message: "El nombre es obligatorio" };
      }
      const email = this.validarEmail(data.email);
      const origen = (
        ORIGENES.includes(data.origen || "") ? data.origen : "CONTACTO"
      ) as "CONTACTO" | "DEMO" | "PLAN" | "NEWSLETTER";

      return await this.prisma.lead.create({
        data: {
          nombre,
          email,
          telefono: data.telefono?.trim() || undefined,
          empresa: data.empresa?.trim() || undefined,
          mensaje: data.mensaje?.trim() || undefined,
          origen,
        },
      });
    } catch (err: any) {
      throw {
        status: err?.status || 500,
        message: err?.message || "Error al registrar la solicitud",
      };
    }
  }

  /** Crea una sesión de Stripe Checkout (suscripción mensual) para un plan. */
  async crearCheckout(plan: string, email?: string): Promise<{ url: string }> {
    const monto = PRECIOS[plan];
    if (!monto) {
      throw { status: 400, message: "Plan no válido para pago en línea" };
    }
    if (!this.stripe) {
      // 503 = el frontend cae a captura de lead.
      throw {
        status: 503,
        message: "El pago en línea no está configurado todavía",
      };
    }
    try {
      const session = await this.stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "usd",
              product_data: { name: `VET-ERP — Plan ${plan}` },
              unit_amount: monto,
              recurring: { interval: "month" },
            },
          },
        ],
        customer_email:
          email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : undefined,
        success_url: `${this.frontendUrl}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${this.frontendUrl}/?checkout=cancel`,
      });

      await this.prisma.suscripcion.create({
        data: {
          plan,
          email: email || undefined,
          monto: monto / 100,
          moneda: "usd",
          estado: "PENDIENTE",
          stripe_session_id: session.id,
        },
      });

      if (!session.url) {
        throw { status: 502, message: "Stripe no devolvió la URL de pago" };
      }
      return { url: session.url };
    } catch (err: any) {
      throw {
        status: err?.status || 502,
        message: err?.message || "No se pudo iniciar el pago",
      };
    }
  }

  /** Verifica el resultado del pago al volver de Stripe y actualiza la suscripción. */
  async verificarCheckout(sessionId: string) {
    if (!this.stripe) {
      throw { status: 503, message: "Pago no configurado" };
    }
    try {
      const session = await this.stripe.checkout.sessions.retrieve(sessionId);
      const pagado = session.payment_status === "paid";
      if (pagado) {
        await this.prisma.suscripcion.updateMany({
          where: { stripe_session_id: sessionId },
          data: { estado: "PAGADO" },
        });
        // Activa la cuenta del comprador y le envía el correo (idempotente).
        await this.provisionarCuenta(
          sessionId,
          session.customer_details?.email || undefined,
          session.customer_details?.name || undefined,
        );
      } else if (session.status === "expired") {
        await this.prisma.suscripcion.updateMany({
          where: { stripe_session_id: sessionId },
          data: { estado: "CANCELADO" },
        });
      }
      const sus = await this.prisma.suscripcion.findFirst({
        where: { stripe_session_id: sessionId },
      });
      return {
        pagado,
        estado: sus?.estado ?? (pagado ? "PAGADO" : "PENDIENTE"),
        plan: sus?.plan ?? null,
      };
    } catch (err: any) {
      throw {
        status: err?.status || 502,
        message: err?.message || "No se pudo verificar el pago",
      };
    }
  }

  /**
   * Crea/activa la cuenta del comprador tras el pago y le envía un correo.
   * Idempotente (usa cuenta_provisionada) y nunca interrumpe el flujo.
   */
  private async provisionarCuenta(
    sessionId: string,
    email?: string,
    nombre?: string,
  ) {
    try {
      const sus = await this.prisma.suscripcion.findFirst({
        where: { stripe_session_id: sessionId },
      });
      if (!sus || sus.cuenta_provisionada) return;

      const correo = (email || sus.email || "").trim().toLowerCase();
      if (!correo) return;
      const nombreFinal = (nombre || correo.split("@")[0]).trim();

      let usuario = await this.prisma.usuario.findUnique({
        where: { email: correo },
      });
      let passwordTemporal: string | undefined;

      if (!usuario) {
        const rol = await this.prisma.role.findFirst({
          where: { nombre: { equals: "ADMIN", mode: "insensitive" } },
        });
        if (rol) {
          passwordTemporal = this.generarPassword();
          const hash = await this.passwords.hash(passwordTemporal);
          usuario = await this.prisma.usuario.create({
            data: {
              nombre: nombreFinal,
              email: correo,
              password_hash: hash,
              rol_id: rol.id,
              debe_cambiar_password: true,
            },
          });
        }
      }

      await this.prisma.suscripcion.update({
        where: { id: sus.id },
        data: {
          cuenta_provisionada: true,
          usuario_id: usuario?.id,
          email: correo,
          nombre: nombreFinal,
        },
      });

      await this.mail.enviarPagoConfirmado({
        email: correo,
        nombre: nombreFinal,
        plan: sus.plan,
        password: passwordTemporal,
        loginUrl: this.frontendUrl,
      });
    } catch (err: any) {
      console.error(
        "[Landing] Provisión de cuenta falló:",
        err?.message || err,
      );
    }
  }

  private generarPassword(): string {
    // Cumple política: 8+ caracteres, mayúscula, minúscula y número.
    return "Vet" + crypto.randomBytes(4).toString("hex") + "7";
  }

  /** Listado de suscripciones (para el administrador). */
  async getSuscripciones() {
    return this.prisma.suscripcion.findMany({
      orderBy: { created_at: "desc" },
      take: 100,
    });
  }

  /** Listado de leads (para el administrador). */
  async getLeads() {
    return this.prisma.lead.findMany({
      orderBy: { created_at: "desc" },
      take: 100,
    });
  }
}
