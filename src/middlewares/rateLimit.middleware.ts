import { Request, Response, NextFunction } from "express";

/**
 * Límite de peticiones por IP, en memoria (anti-spam básico para formularios
 * públicos de la landing). Sin dependencias externas.
 */
export function rateLimit(opts: { windowMs: number; max: number }) {
  const hits = new Map<string, number[]>();
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const now = Date.now();
    const recientes = (hits.get(ip) || []).filter(
      (t) => now - t < opts.windowMs,
    );
    if (recientes.length >= opts.max) {
      return res
        .status(429)
        .json({ message: "Demasiadas solicitudes. Intenta de nuevo en un momento." });
    }
    recientes.push(now);
    hits.set(ip, recientes);
    next();
  };
}
