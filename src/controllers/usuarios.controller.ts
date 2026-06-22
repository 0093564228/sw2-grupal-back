import { Request, Response } from "express";
import { UsuariosService } from "../services/usuarios.service";
import { ErrorHandler } from "../middlewares/error.middleware";

export class UsuariosController {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly errors: ErrorHandler,
  ) {}

  getUsuarios = async (req: Request, res: Response) => {
    try {
      const { rol, search } = req.query as { rol?: string; search?: string };
      const usuarios = await this.usuariosService.getUsuarios(rol, search);
      res.json(usuarios);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  getUsuarioById = async (req: Request, res: Response) => {
    try {
      const usuario = await this.usuariosService.getUsuarioById(
        req.params.id as string,
      );
      if (!usuario) return this.errors.e404(req, res);
      res.json(usuario);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  createUsuario = async (req: Request, res: Response) => {
    try {
      const usuario = await this.usuariosService.createUsuario(req.body);
      res.status(201).json(usuario);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  updateUsuario = async (req: Request, res: Response) => {
    try {
      const usuario = await this.usuariosService.updateUsuario(
        req.params.id as string,
        req.body,
      );
      res.json(usuario);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  deleteUsuario = async (req: Request, res: Response) => {
    try {
      await this.usuariosService.deleteUsuario(req.params.id as string);
      res.json({ ok: true });
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };
}
