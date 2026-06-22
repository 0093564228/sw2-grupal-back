import { Request, Response } from "express";
import { LaboratorioService } from "../services/laboratorio.service";
import { ErrorHandler } from "../middlewares/error.middleware";

export class LaboratorioController {
  constructor(
    private readonly laboratorioService: LaboratorioService,
    private readonly errors: ErrorHandler,
  ) {}

  getOrdenes = async (req: Request, res: Response) => {
    try {
      const ordenes = await this.laboratorioService.getOrdenes(
        req.query.estado as string | undefined,
      );
      res.json(ordenes);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  getOrdenById = async (req: Request, res: Response) => {
    try {
      const orden = await this.laboratorioService.getOrdenById(
        req.params.id as string,
      );
      if (!orden) return this.errors.e404(req, res);
      res.json(orden);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  createOrden = async (req: Request, res: Response) => {
    try {
      const orden = await this.laboratorioService.createOrden(req.body);
      res.status(201).json(orden);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  updateEstado = async (req: Request, res: Response) => {
    try {
      const orden = await this.laboratorioService.updateEstadoOrden(
        req.params.id as string,
        req.body.estado,
      );
      res.json(orden);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  cargarResultado = async (req: Request, res: Response) => {
    try {
      const resultado = await this.laboratorioService.cargarResultado(
        req.params.id as string,
        req.body,
      );
      res.json(resultado);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };
}
