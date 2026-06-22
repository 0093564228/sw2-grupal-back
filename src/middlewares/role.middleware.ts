import { Request, Response, NextFunction } from "express";

/**
 * Middleware de autorización basado en roles.
 *
 * Lee el rol directamente desde req.user.rol (extraído del JWT por AuthMiddleware),
 * eliminando la consulta a la base de datos que existía en la versión anterior.
 *
 * Antes era una función factory suelta (requireRole); ahora es una clase para
 * mantener la coherencia con el resto de la infraestructura inyectable. El
 * composition root la instancia y las rutas usan `roleMiddleware.require('Admin')`.
 *
 * REQUISITO: `require()` DEBE ir después de `authMiddleware.authenticate` en la
 * cadena de middlewares. El rol se embebe en el JWT durante el login — ver
 * auth.service.ts y services/token.service.ts.
 */
export class RoleMiddleware {
  require = (...rolesPermitidos: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({ error: "Token no proporcionado" });
      }

      // Comparación case-insensitive: la BD guarda los roles en MAYÚSCULAS
      // (ADMIN, CAJERO…) pero require() se invoca con 'Admin', 'Cajero'…
      const permitidos = rolesPermitidos.map((r) => r.toUpperCase().trim());
      const rolNormalizado = req.user.rol?.toUpperCase().trim();

      if (!rolNormalizado || !permitidos.includes(rolNormalizado)) {
        return res
          .status(403)
          .json({ error: "No autorizado para esta acción" });
      }

      next();
    };
  };
}
