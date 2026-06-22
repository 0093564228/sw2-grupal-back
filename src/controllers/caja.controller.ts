import { Request, Response } from "express";
import { CajaService } from "../services/caja.service";
import { getUserId } from "../middlewares/auth.middleware";
import { ErrorHandler } from "../middlewares/error.middleware";

export class CajaController {
  constructor(
    private readonly cajaService: CajaService,
    private readonly errors: ErrorHandler,
  ) {}

  getPendientes = async (req: Request, res: Response) => {
    try {
      const fichas = await this.cajaService.getFichasPendientePago();
      res.json(fichas);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  getRecibos = async (req: Request, res: Response) => {
    try {
      const recibos = await this.cajaService.getRecibos();
      res.json(recibos);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  getReciboById = async (req: Request, res: Response) => {
    try {
      const recibo = await this.cajaService.getReciboById(
        req.params.id as string,
      );
      if (!recibo) return this.errors.e404(req, res);
      res.json(recibo);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  cobrarFicha = async (req: Request, res: Response) => {
    try {
      // cajero_id SIEMPRE desde el token, nunca del body (trazabilidad)
      const recibo = await this.cajaService.cobrarFicha({
        ...req.body,
        cajero_id: getUserId(req),
      });
      res.status(201).json(recibo);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  ventaDirecta = async (req: Request, res: Response) => {
    try {
      // cajero_id SIEMPRE desde el token, nunca del body (trazabilidad)
      const recibo = await this.cajaService.ventaDirecta({
        ...req.body,
        cajero_id: getUserId(req),
      });
      res.status(201).json(recibo);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  anularRecibo = async (req: Request, res: Response) => {
    try {
      const { motivo_anulacion } = req.body;
      const recibo = await this.cajaService.anularRecibo(
        req.params.id as string,
        motivo_anulacion,
      );
      res.json(recibo);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };
}
