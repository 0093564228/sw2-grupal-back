import { Request, Response } from "express";

/**
 * Manejador centralizado de respuestas de error HTTP.
 *
 * Antes era un objeto literal (errorMiddleware); ahora es una clase inyectable
 * que el composition root (container.ts) instancia una sola vez y provee a cada
 * controller por constructor. Los métodos son arrow properties para conservar el
 * binding de `this` aunque se pasen por referencia.
 */
export class ErrorHandler {
  e400 = (req: Request, res: Response, err: any) => {
    res.status(400).json({
      error: "Error 400 Bad Request",
      message: err?.message || "Solicitud inválida",
    });
  };

  e401 = (req: Request, res: Response, err: any) => {
    res.status(401).json({
      error: "Error 401 Authorization Required",
      message: err?.message || "No autorizado",
    });
  };

  e404 = (req: Request, res: Response) => {
    res.status(404).json({
      error: "Error 404 Not Found",
      message: "El recurso solicitado no existe",
    });
  };

  e500 = (req: Request, res: Response, err: any) => {
    res.status(err?.status || 500).json({
      error: `Error ${err?.status || 500}`,
      message: err?.message || "Error interno del servidor",
    });
  };
}
