import nodemailer, { Transporter } from "nodemailer";

/**
 * Servicio de correo (Nodemailer + Gmail SMTP).
 *
 * Si no hay credenciales (SMTP_USER / SMTP_PASS) el servicio NO falla: solo
 * registra en consola lo que enviaría. Así el resto del sistema funciona igual
 * y los correos se activan en cuanto se configuren las credenciales en el .env.
 */
export class MailService {
  private readonly transporter: Transporter | null = null;
  private readonly from: string;

  constructor(opts: { user?: string; pass?: string; from?: string }) {
    this.from = opts.from || opts.user || "VET-ERP";
    // Las App Passwords de Google se muestran con espacios (solo visuales): los quitamos.
    const pass = opts.pass ? opts.pass.replace(/\s+/g, "") : "";
    if (opts.user && pass) {
      this.transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: { user: opts.user, pass },
      });
    }
  }

  /** Correo de confirmación (cuando la cita queda programada/confirmada). */
  async enviarConfirmacionCita(cita: any): Promise<void> {
    await this.enviar(cita, "confirmacion");
  }

  /** Correo de recordatorio (cita próxima). */
  async enviarRecordatorioCita(cita: any): Promise<void> {
    await this.enviar(cita, "recordatorio");
  }

  /**
   * Correo tras el pago de un plan: confirma la suscripción y, si se acaba de
   * crear la cuenta, incluye las credenciales de acceso. Nunca lanza.
   */
  async enviarPagoConfirmado(opts: {
    email: string;
    nombre?: string;
    plan: string;
    password?: string;
    loginUrl?: string;
  }): Promise<void> {
    try {
      const { email, plan, password } = opts;
      if (!email) return;
      const nombre = opts.nombre || "Estimado/a cliente";
      const loginUrl = opts.loginUrl || "http://localhost:5173";
      const asunto = `Pago confirmado — Plan ${plan} | VET-ERP`;

      const credText = password
        ? `\nYa creamos tu cuenta de acceso:\n  Usuario (correo): ${email}\n  Contraseña temporal: ${password}\n  Ingresa en: ${loginUrl}\n(Por seguridad, cambia tu contraseña al iniciar sesión.)\n`
        : `\nTu cuenta ya tiene acceso con este correo: ${email}\nIngresa en: ${loginUrl}\n`;

      const texto =
        `Hola ${nombre},\n\n¡Gracias! Tu pago del plan ${plan} fue confirmado y tu suscripción quedó activa.\n` +
        credText +
        `\nHospital Escuela de Veterinaria U.A.G.R.M.`;

      const credHtml = password
        ? `<div style="margin:16px 0;padding:16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px">
             <p style="margin:0 0 8px;font-weight:bold;color:#1e293b">Tus credenciales de acceso</p>
             <p style="margin:2px 0;font-size:14px">Usuario: <strong>${email}</strong></p>
             <p style="margin:2px 0;font-size:14px">Contraseña temporal: <strong>${password}</strong></p>
             <p style="margin:8px 0 0;font-size:12px;color:#64748b">Por seguridad, cambia tu contraseña al iniciar sesión.</p>
           </div>`
        : `<p style="font-size:14px;color:#334155">Tu cuenta ya tiene acceso con el correo <strong>${email}</strong>.</p>`;

      const html = `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;border:1px solid #eee;border-radius:12px;overflow:hidden">
          <div style="background:#facc15;padding:16px 24px">
            <h2 style="margin:0;color:#1e293b">¡Pago confirmado!</h2>
            <p style="margin:4px 0 0;color:#1e293b;font-size:13px">Plan ${plan} — VET-ERP</p>
          </div>
          <div style="padding:24px;color:#334155">
            <p>Hola <strong>${nombre}</strong>,</p>
            <p>¡Gracias! Tu pago del <strong>plan ${plan}</strong> fue confirmado y tu suscripción quedó activa.</p>
            ${credHtml}
            <p style="text-align:center;margin:20px 0">
              <a href="${loginUrl}" style="background:#facc15;color:#1e293b;text-decoration:none;font-weight:bold;padding:10px 24px;border-radius:8px;display:inline-block">Ingresar al sistema</a>
            </p>
          </div>
        </div>`;

      if (!this.transporter) {
        console.log(
          `[MailService] (sin credenciales SMTP) Se enviaría a ${email}: "${asunto}"`,
        );
        return;
      }
      await this.transporter.sendMail({
        from: this.from,
        to: email,
        subject: asunto,
        text: texto,
        html,
      });
      console.log(`[MailService] Pago confirmado enviado a ${email}`);
    } catch (err: any) {
      console.error(
        "[MailService] No se pudo enviar el correo de pago:",
        err?.message || err,
      );
    }
  }

  private async enviar(
    cita: any,
    tipo: "confirmacion" | "recordatorio",
  ): Promise<void> {
    try {
      const email: string | undefined = cita?.mascota?.propietario?.email;
      if (!email) return;

      const nombre = cita?.mascota?.propietario?.nombre || "Estimado/a cliente";
      const mascota = cita?.mascota?.nombre || "su mascota";
      const fecha = new Date(cita.fecha_hora);
      const fechaStr = fecha.toLocaleDateString("es-ES", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      const horaStr = fecha.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      });

      const esRec = tipo === "recordatorio";
      const titulo = esRec ? "Recordatorio de cita" : "Confirmación de cita";
      const asunto = `${titulo} — ${mascota}`;
      const intro = esRec
        ? `Le recordamos la próxima cita de ${mascota} en el Hospital Escuela de Veterinaria U.A.G.R.M.:`
        : `Le confirmamos la cita de ${mascota} en el Hospital Escuela de Veterinaria U.A.G.R.M.:`;

      const texto =
        `Hola ${nombre},\n\n${intro}\n\n` +
        `Fecha: ${fechaStr}\n` +
        `Hora: ${horaStr}\n` +
        (cita.motivo ? `Motivo: ${cita.motivo}\n` : "") +
        `\nPor favor llegue 10 minutos antes. Si no puede asistir, comuníquese para reprogramar.\n\n` +
        `Hospital Escuela de Veterinaria U.A.G.R.M.`;

      const html = `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;border:1px solid #eee;border-radius:12px;overflow:hidden">
          <div style="background:#facc15;padding:16px 24px">
            <h2 style="margin:0;color:#1e293b">${titulo}</h2>
            <p style="margin:4px 0 0;color:#1e293b;font-size:13px">Hospital Escuela de Veterinaria U.A.G.R.M.</p>
          </div>
          <div style="padding:24px;color:#334155">
            <p>Hola <strong>${nombre}</strong>,</p>
            <p>${intro}</p>
            <table style="margin:16px 0;font-size:15px">
              <tr><td style="padding:4px 0">📅 <strong>Fecha:</strong></td><td style="padding:4px 0 4px 12px">${fechaStr}</td></tr>
              <tr><td style="padding:4px 0">🕐 <strong>Hora:</strong></td><td style="padding:4px 0 4px 12px">${horaStr}</td></tr>
              ${cita.motivo ? `<tr><td style="padding:4px 0">📝 <strong>Motivo:</strong></td><td style="padding:4px 0 4px 12px">${cita.motivo}</td></tr>` : ""}
            </table>
            <p style="font-size:13px;color:#64748b">Por favor llegue 10 minutos antes. Si no puede asistir, comuníquese para reprogramar.</p>
          </div>
        </div>`;

      if (!this.transporter) {
        console.log(
          `[MailService] (sin credenciales SMTP) Se enviaría a ${email}: "${asunto}"`,
        );
        return;
      }

      await this.transporter.sendMail({
        from: this.from,
        to: email,
        subject: asunto,
        text: texto,
        html,
      });
      console.log(
        `[MailService] ${esRec ? "Recordatorio" : "Confirmación"} enviado a ${email}`,
      );
    } catch (err: any) {
      // Nunca interrumpir el flujo de la cita por un fallo de correo.
      console.error(
        "[MailService] No se pudo enviar el correo:",
        err?.message || err,
      );
    }
  }
}
