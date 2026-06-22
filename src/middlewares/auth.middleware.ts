import { Request, Response, NextFunction } from "express";
import { TokenService } from "../services/token.service";

/**
 * Middleware de autenticación basado en JWT.
 *
 * Antes era una función suelta que llamaba a helpers/jwt.verifyToken; ahora es
 * una clase que recibe TokenService por inyección de dependencias. El composition
 * root la instancia y expone `authMiddleware.authenticate` a las rutas.
 * `authenticate` es una arrow property para conservar el binding de `this`.
 */
export class AuthMiddleware {
  constructor(private readonly tokenService: TokenService) {}

  authenticate = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Token no proporcionado" });
    }

    const token = authHeader.slice(7);
    const payload = this.tokenService.verify(token);

    if (!payload) {
      return res.status(401).json({ error: "Token inválido o expirado" });
    }

    req.user = {
      id: payload.id,
      rol_id: payload.rol_id,
      rol: payload.rol,
    };

    next();
  };
}

/**
 * Obtiene el id del usuario autenticado de forma segura.
 * Las rutas que lo usan DEBEN pasar antes por `AuthMiddleware.authenticate`.
 * Si por un error de configuración la ruta quedara sin proteger,
 * lanza un error controlado en lugar de reventar con un TypeError;
 * el try/catch de cada controlador lo convierte en una respuesta de error.
 *
 * Se mantiene como función suelta (sin dependencias) porque solo lee req.user,
 * de modo que los controllers pueden importarla sin necesidad de inyectar el middleware.
 */
export const getUserId = (req: Request): string => {
  if (!req.user?.id) {
    throw new Error("Usuario no autenticado");
  }
  return req.user.id;
};
