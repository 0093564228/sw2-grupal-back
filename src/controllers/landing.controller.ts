import { Request, Response } from "express";
import { LandingService } from "../services/landing.service";
import { ErrorHandler } from "../middlewares/error.middleware";

export class LandingController {
  constructor(
    private readonly landing: LandingService,
    private readonly errors: ErrorHandler,
  ) {}

  // Formulario de contacto / demo / interés en plan (público).
  crearLead = async (req: Request, res: Response) => {
    try {
      // Honeypot: el campo oculto 'website' debe venir vacío. Si tiene algo,
      // es un bot → respondemos "ok" sin guardar nada.
      if (req.body?.website) {
        return res.status(200).json({ ok: true });
      }
      const lead = await this.landing.crearLead(req.body);
      res.status(201).json({ ok: true, id: lead.id });
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  // Inicia el pago de un plan: crea la sesión de Stripe Checkout (público).
  crearCheckout = async (req: Request, res: Response) => {
    try {
      if (req.body?.website) {
        return res.status(400).json({ message: "Solicitud no válida" });
      }
      const { plan, email } = req.body as { plan?: string; email?: string };
      const result = await this.landing.crearCheckout(String(plan || ""), email);
      res.json(result);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  // Verifica el pago al volver de Stripe (público).
  verificarCheckout = async (req: Request, res: Response) => {
    try {
      const sessionId = String(req.query.session_id || "");
      if (!sessionId) {
        return res.status(400).json({ message: "Falta session_id" });
      }
      const result = await this.landing.verificarCheckout(sessionId);
      res.json(result);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  // Listado de leads (solo Admin).
  getLeads = async (req: Request, res: Response) => {
    try {
      res.json(await this.landing.getLeads());
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  // Listado de suscripciones (solo Admin).
  getSuscripciones = async (req: Request, res: Response) => {
    try {
      res.json(await this.landing.getSuscripciones());
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };
}
