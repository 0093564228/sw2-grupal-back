import { Request, Response } from "express";
import { FichaService } from "../services/ficha.service";
import { getUserId } from "../middlewares/auth.middleware";
import { ErrorHandler } from "../middlewares/error.middleware";

export class FichaController {
  constructor(
    private readonly fichaService: FichaService,
    private readonly errors: ErrorHandler,
  ) {}

  getFichas = async (req: Request, res: Response) => {
    try {
      const { estado, doctor_id, fecha } = req.query as Record<string, string>;
      const fichas = await this.fichaService.getFichas({
        estado,
        doctor_id,
        fecha,
      });
      res.json(fichas);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  getFichaById = async (req: Request, res: Response) => {
    try {
      const ficha = await this.fichaService.getFichaById(
        req.params.id as string,
      );
      if (!ficha) return this.errors.e404(req, res);
      res.json(ficha);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  createFicha = async (req: Request, res: Response) => {
    try {
      // creado_por_id SIEMPRE desde el token: el actor que crea la ficha
      const ficha = await this.fichaService.createFicha({
        ...req.body,
        creado_por_id: getUserId(req),
      });
      res.status(201).json(ficha);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  iniciarFicha = async (req: Request, res: Response) => {
    try {
      // doctor_id del body = asignación deliberada; si no viene, cae al actor del token
      const ficha = await this.fichaService.iniciarFicha(
        req.params.id as string,
        req.body,
        getUserId(req),
      );
      res.json(ficha);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  completarFicha = async (req: Request, res: Response) => {
    try {
      const ficha = await this.fichaService.completarFicha(
        req.params.id as string,
      );
      res.json(ficha);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  cancelarFicha = async (req: Request, res: Response) => {
    try {
      const ficha = await this.fichaService.cancelarFicha(
        req.params.id as string,
      );
      res.json(ficha);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  updateFicha = async (req: Request, res: Response) => {
    try {
      const ficha = await this.fichaService.updateFicha(
        req.params.id as string,
        req.body,
      );
      res.json(ficha);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  getSoap = async (req: Request, res: Response) => {
    try {
      const soap = await this.fichaService.getSoap(req.params.id as string);
      if (!soap) return this.errors.e404(req, res);
      res.json(soap);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  upsertSoap = async (req: Request, res: Response) => {
    try {
      const soap = await this.fichaService.upsertSoap(
        req.params.id as string,
        req.body,
      );
      res.json(soap);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  createReceta = async (req: Request, res: Response) => {
    try {
      const receta = await this.fichaService.createReceta(
        req.params.id as string,
        req.body,
      );
      res.status(201).json(receta);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  getConsumos = async (req: Request, res: Response) => {
    try {
      const consumos = await this.fichaService.getConsumos(
        req.params.id as string,
      );
      res.json(consumos);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  addConsumo = async (req: Request, res: Response) => {
    try {
      const consumo = await this.fichaService.addConsumo(
        req.params.id as string,
        req.body,
      );
      res.status(201).json(consumo);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  removeConsumo = async (req: Request, res: Response) => {
    try {
      await this.fichaService.removeConsumo(req.params.consumoId as string);
      res.json({ ok: true });
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };
}
