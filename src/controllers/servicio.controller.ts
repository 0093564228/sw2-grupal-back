import { Request, Response } from "express";
import { ServicioService } from "../services/servicio.service";
import { ErrorHandler } from "../middlewares/error.middleware";

export class ServicioController {
  constructor(
    private readonly servicioService: ServicioService,
    private readonly errors: ErrorHandler,
  ) {}

  getServicios = async (req: Request, res: Response) => {
    try {
      const soloActivos = req.query.activos === "true";
      res.json(await this.servicioService.getServicios(soloActivos));
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  createServicio = async (req: Request, res: Response) => {
    try {
      res.status(201).json(await this.servicioService.createServicio(req.body));
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  updateServicio = async (req: Request, res: Response) => {
    try {
      res.json(
        await this.servicioService.updateServicio(
          req.params.id as string,
          req.body,
        ),
      );
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  deleteServicio = async (req: Request, res: Response) => {
    try {
      res.json(
        await this.servicioService.deleteServicio(req.params.id as string),
      );
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };
}
