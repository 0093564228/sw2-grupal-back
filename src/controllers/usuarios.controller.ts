import { Request, Response } from "express";
import { UsuariosService } from "../services/usuarios.service";
import { ErrorHandler } from "../middlewares/error.middleware";
import { getUserId } from "../middlewares/auth.middleware";

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

  /** Cambia la contraseña del usuario autenticado (cualquier rol). */
  changeMyPassword = async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const { currentPassword, newPassword } = req.body as {
        currentPassword?: string;
        newPassword?: string;
      };
      if (!currentPassword || !newPassword) {
        return res
          .status(400)
          .json({ message: "Debes indicar la contraseña actual y la nueva" });
      }
      const result = await this.usuariosService.changeOwnPassword(
        userId,
        currentPassword,
        newPassword,
      );
      res.json(result);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };
}
