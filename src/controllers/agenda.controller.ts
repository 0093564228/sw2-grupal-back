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
      const { fecha, doctor_id } = req.query;
      const citas = await this.agendaService.getCitas(
        fecha as string,
        doctor_id as string,
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
}
