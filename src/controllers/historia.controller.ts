import { Request, Response } from "express";
import { HistoriaService } from "../services/historia.service";
import { getUserId } from "../middlewares/auth.middleware";
import { ErrorHandler } from "../middlewares/error.middleware";

export class HistoriaController {
  constructor(
    private readonly historiaService: HistoriaService,
    private readonly errors: ErrorHandler,
  ) {}

  list = async (req: Request, res: Response) => {
    try {
      const { mascota_id, ficha_id } = req.query as {
        mascota_id?: string;
        ficha_id?: string;
      };
      if (ficha_id) {
        return res.json(await this.historiaService.getByFicha(ficha_id));
      }
      if (!mascota_id) {
        return this.errors.e400(req, res, {
          message: "mascota_id o ficha_id es requerido",
        });
      }
      res.json(await this.historiaService.getByMascota(mascota_id));
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  getById = async (req: Request, res: Response) => {
    try {
      const h = await this.historiaService.getById(req.params.id as string);
      if (!h) return this.errors.e404(req, res);
      res.json(h);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      res
        .status(201)
        .json(await this.historiaService.create(req.body, getUserId(req)));
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      res.json(
        await this.historiaService.update(req.params.id as string, req.body),
      );
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  finalizar = async (req: Request, res: Response) => {
    try {
      res.json(
        await this.historiaService.finalizar(
          req.params.id as string,
          getUserId(req),
        ),
      );
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  remove = async (req: Request, res: Response) => {
    try {
      await this.historiaService.remove(req.params.id as string);
      res.json({ ok: true });
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };
}
