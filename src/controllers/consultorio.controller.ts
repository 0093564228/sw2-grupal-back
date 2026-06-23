import { Request, Response } from "express";
import { ConsultorioEstado } from "@prisma/client";
import { ConsultorioService } from "../services/consultorio.service";
import { ErrorHandler } from "../middlewares/error.middleware";

export class ConsultorioController {
  constructor(
    private readonly consultorioService: ConsultorioService,
    private readonly errors: ErrorHandler,
  ) {}

  getConsultorios = async (req: Request, res: Response) => {
    try {
      const consultorios = await this.consultorioService.getConsultorios();
      res.json(consultorios);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  createConsultorio = async (req: Request, res: Response) => {
    try {
      const consultorio = await this.consultorioService.createConsultorio(
        req.body,
      );
      res.status(201).json(consultorio);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  updateEstado = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const { estado } = req.body;
      const consultorio = await this.consultorioService.updateEstado(
        id,
        estado,
      );
      res.json(consultorio);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  updateConsultorio = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const { nombre, especialidad, estado, tipo, responsable_id } = req.body;
      const consultorio = await this.consultorioService.updateConsultorio(id, {
        ...(nombre !== undefined && { nombre }),
        ...(especialidad !== undefined && { especialidad }),
        ...(estado !== undefined && { estado: estado as ConsultorioEstado }),
        ...(tipo !== undefined && { tipo }),
        // responsable_id puede ser un id (asignar) o null (quitar responsable)
        ...(responsable_id !== undefined && {
          responsable_id: responsable_id || null,
        }),
      });
      res.json(consultorio);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  deleteConsultorio = async (req: Request, res: Response) => {
    try {
      await this.consultorioService.deleteConsultorio(req.params.id as string);
      res.json({ ok: true });
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };
}
