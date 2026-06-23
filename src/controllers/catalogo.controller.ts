import { Request, Response } from "express";
import { CatalogoService } from "../services/catalogo.service";
import { ErrorHandler } from "../middlewares/error.middleware";

export class CatalogoController {
  constructor(
    private readonly catalogoService: CatalogoService,
    private readonly errors: ErrorHandler,
  ) {}

  getEspecies = async (req: Request, res: Response) => {
    try {
      res.json(await this.catalogoService.getEspecies());
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  getRazas = async (req: Request, res: Response) => {
    try {
      res.json(
        await this.catalogoService.getRazas(req.query.especie_id as string),
      );
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  getColores = async (req: Request, res: Response) => {
    try {
      res.json(await this.catalogoService.getColores());
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  getAlergias = async (req: Request, res: Response) => {
    try {
      res.json(await this.catalogoService.getAlergias());
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  getServicios = async (req: Request, res: Response) => {
    try {
      res.json(await this.catalogoService.getServicios());
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  getCategorias = async (req: Request, res: Response) => {
    try {
      res.json(await this.catalogoService.getCategorias());
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  getRoles = async (req: Request, res: Response) => {
    try {
      res.json(await this.catalogoService.getRoles());
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  getVeterinarios = async (req: Request, res: Response) => {
    try {
      res.json(await this.catalogoService.getVeterinarios());
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  getPropietarios = async (req: Request, res: Response) => {
    try {
      res.json(
        await this.catalogoService.getPropietarios(
          req.query.search as string | undefined,
        ),
      );
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };
}
