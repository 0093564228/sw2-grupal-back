import { Request, Response } from "express";
import { MascotaService } from "../services/mascota.service";
import { ErrorHandler } from "../middlewares/error.middleware";

export class MascotaController {
  constructor(
    private readonly mascotaService: MascotaService,
    private readonly errors: ErrorHandler,
  ) {}

  getMascotas = async (req: Request, res: Response) => {
    try {
      const search = req.query.search as string | undefined;
      const propietario_id = req.query.propietario_id as string | undefined;
      const mascotas = await this.mascotaService.getMascotas(
        search,
        propietario_id,
      );
      res.json(mascotas);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  getMascotaById = async (req: Request, res: Response) => {
    try {
      const mascota = await this.mascotaService.getMascotaById(
        req.params.id as string,
      );
      if (!mascota) return this.errors.e404(req, res);
      res.json(mascota);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  createMascota = async (req: Request, res: Response) => {
    try {
      const mascota = await this.mascotaService.createMascotaConPropietario(
        req.body,
      );
      res.status(201).json(mascota);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  updateMascota = async (req: Request, res: Response) => {
    try {
      const mascota = await this.mascotaService.updateMascota(
        req.params.id as string,
        req.body,
      );
      res.json(mascota);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  deleteMascota = async (req: Request, res: Response) => {
    try {
      await this.mascotaService.deleteMascota(req.params.id as string);
      res.json({ ok: true });
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };
}
