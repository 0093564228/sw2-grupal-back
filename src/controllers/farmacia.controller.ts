import { Request, Response } from "express";
import { FarmaciaService } from "../services/farmacia.service";
import { getUserId } from "../middlewares/auth.middleware";
import { ErrorHandler } from "../middlewares/error.middleware";

export class FarmaciaController {
  constructor(
    private readonly farmaciaService: FarmaciaService,
    private readonly errors: ErrorHandler,
  ) {}

  getRecetasPendientes = async (req: Request, res: Response) => {
    try {
      const recetas = await this.farmaciaService.getRecetasPendientes();
      res.json(recetas);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  dispensarReceta = async (req: Request, res: Response) => {
    try {
      const recetaId = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;
      const receta = await this.farmaciaService.dispensarReceta(
        recetaId,
        getUserId(req),
      );
      res.json(receta);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };
}
