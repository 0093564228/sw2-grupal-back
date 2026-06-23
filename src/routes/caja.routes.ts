import { Router } from "express";
import { cajaController, authMiddleware, roleMiddleware } from "../container";

const router = Router();

// Todas las rutas de caja requieren sesión válida
router.use(authMiddleware.authenticate);

// Lectura: cualquier usuario logueado
router.get("/pendientes", cajaController.getPendientes);
router.get("/recibos", cajaController.getRecibos);
router.get("/recibos/:id", cajaController.getReciboById);

// Escritura: solo Cajero o Administrador
router.post(
  "/recibos",
  roleMiddleware.require("Cajero", "Admin"),
  cajaController.cobrarFicha,
);
router.post(
  "/venta-directa",
  roleMiddleware.require("Cajero", "Admin"),
  cajaController.ventaDirecta,
);
router.put(
  "/recibos/:id/anular",
  roleMiddleware.require("Cajero", "Admin"),
  cajaController.anularRecibo,
);

// Arqueo y cierre de caja: solo Cajero o Administrador
router.get(
  "/arqueo",
  roleMiddleware.require("Cajero", "Admin"),
  cajaController.getArqueo,
);
router.get(
  "/cierres",
  roleMiddleware.require("Cajero", "Admin"),
  cajaController.getCierres,
);
router.post(
  "/cierres",
  roleMiddleware.require("Cajero", "Admin"),
  cajaController.registrarCierre,
);

export default router;
