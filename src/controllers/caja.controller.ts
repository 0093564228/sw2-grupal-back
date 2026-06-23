import { Request, Response } from "express";
import { CajaService } from "../services/caja.service";
import { getUserId } from "../middlewares/auth.middleware";
import { ErrorHandler } from "../middlewares/error.middleware";

// Rango de un día (local): de 00:00 a 23:59:59.999.
function rangoDelDia(fecha?: string) {
  const base = fecha ? new Date(`${fecha}T00:00:00`) : new Date();
  const desde = new Date(base);
  desde.setHours(0, 0, 0, 0);
  const hasta = new Date(base);
  hasta.setHours(23, 59, 59, 999);
  return { desde, hasta };
}

export class CajaController {
  constructor(
    private readonly cajaService: CajaService,
    private readonly errors: ErrorHandler,
  ) {}

  // ── Arqueo y cierre de caja ────────────────────────────────────────────────

  getArqueo = async (req: Request, res: Response) => {
    try {
      const { fecha } = req.query as { fecha?: string };
      const { desde, hasta } = rangoDelDia(fecha);
      const arqueo = await this.cajaService.getArqueo(
        getUserId(req),
        desde,
        hasta,
      );
      res.json(arqueo);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  registrarCierre = async (req: Request, res: Response) => {
    try {
      const { fecha, efectivo_contado, observaciones } = req.body as {
        fecha?: string;
        efectivo_contado?: number | string;
        observaciones?: string;
      };
      const { desde, hasta } = rangoDelDia(fecha);
      const cierre = await this.cajaService.registrarCierre(getUserId(req), {
        desde,
        hasta,
        efectivo_contado:
          efectivo_contado != null && efectivo_contado !== ""
            ? Number(efectivo_contado)
            : undefined,
        observaciones,
      });
      res.status(201).json(cierre);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  getCierres = async (req: Request, res: Response) => {
    try {
      const rol = String(req.user?.rol || "").toUpperCase();
      const filtro = rol === "ADMIN" ? undefined : getUserId(req);
      const cierres = await this.cajaService.getCierres(filtro);
      res.json(cierres);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  getPendientes = async (req: Request, res: Response) => {
    try {
      const fichas = await this.cajaService.getFichasPendientePago();
      res.json(fichas);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  getRecibos = async (req: Request, res: Response) => {
    try {
      const recibos = await this.cajaService.getRecibos();
      res.json(recibos);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  getReciboById = async (req: Request, res: Response) => {
    try {
      const recibo = await this.cajaService.getReciboById(
        req.params.id as string,
      );
      if (!recibo) return this.errors.e404(req, res);
      res.json(recibo);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  cobrarFicha = async (req: Request, res: Response) => {
    try {
      // cajero_id SIEMPRE desde el token, nunca del body (trazabilidad)
      const recibo = await this.cajaService.cobrarFicha({
        ...req.body,
        cajero_id: getUserId(req),
      });
      res.status(201).json(recibo);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  ventaDirecta = async (req: Request, res: Response) => {
    try {
      // cajero_id SIEMPRE desde el token, nunca del body (trazabilidad)
      const recibo = await this.cajaService.ventaDirecta({
        ...req.body,
        cajero_id: getUserId(req),
      });
      res.status(201).json(recibo);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  anularRecibo = async (req: Request, res: Response) => {
    try {
      const { motivo_anulacion } = req.body;
      const recibo = await this.cajaService.anularRecibo(
        req.params.id as string,
        motivo_anulacion,
      );
      res.json(recibo);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };
}
