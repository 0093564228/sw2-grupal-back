import { Request, Response } from "express";
import { AgendaService } from "../services/agenda.service";
import { getUserId } from "../middlewares/auth.middleware";
import { ErrorHandler } from "../middlewares/error.middleware";

export class AgendaController {
  constructor(
    private readonly agendaService: AgendaService,
    private readonly errors: ErrorHandler,
  ) {}

  getCitas = async (req: Request, res: Response) => {
    try {
      const { fecha, doctor_id, desde, hasta } = req.query;
      const citas = await this.agendaService.getCitas(
        fecha as string,
        doctor_id as string,
        desde as string,
        hasta as string,
      );
      res.json(citas);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  createCita = async (req: Request, res: Response) => {
    try {
      const cita = await this.agendaService.createCita(req.body);
      res.status(201).json(cita);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  updateCita = async (req: Request, res: Response) => {
    try {
      const cita = await this.agendaService.updateCita(
        req.params.id as string,
        req.body,
      );
      res.json(cita);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  updateEstado = async (req: Request, res: Response) => {
    try {
      const { estado } = req.body;
      const cita = await this.agendaService.updateEstadoCita(
        req.params.id as string,
        estado,
      );
      res.json(cita);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  deleteCita = async (req: Request, res: Response) => {
    try {
      await this.agendaService.deleteCita(req.params.id as string);
      res.status(204).send();
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  checkIn = async (req: Request, res: Response) => {
    try {
      const ficha = await this.agendaService.checkInCita(
        req.params.id as string,
        getUserId(req),
      );
      res.status(201).json(ficha);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  // ── Autoservicio del propietario ──────────────────────────────────────────

  solicitarCita = async (req: Request, res: Response) => {
    try {
      const cita = await this.agendaService.solicitarCitaPropietario(
        getUserId(req),
        req.body,
      );
      res.status(201).json(cita);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  getMisCitas = async (req: Request, res: Response) => {
    try {
      const citas = await this.agendaService.getCitasPropietario(getUserId(req));
      res.json(citas);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  getMisMascotas = async (req: Request, res: Response) => {
    try {
      const mascotas = await this.agendaService.getMascotasPropietario(
        getUserId(req),
      );
      res.json(mascotas);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  getSolicitudes = async (_req: Request, res: Response) => {
    try {
      const sols = await this.agendaService.getSolicitudesPendientes();
      res.json(sols);
    } catch (err) {
      this.errors.e500(_req, res, err);
    }
  };

  getDisponibilidad = async (req: Request, res: Response) => {
    try {
      const { fecha, doctor_id, duracion } = req.query as {
        fecha?: string;
        doctor_id?: string;
        duracion?: string;
      };
      if (!fecha) {
        return res.status(400).json({ message: "Falta la fecha" });
      }
      const slots = await this.agendaService.getDisponibilidad(
        fecha,
        doctor_id || undefined,
        duracion ? Number(duracion) : 30,
      );
      res.json(slots);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };
}
