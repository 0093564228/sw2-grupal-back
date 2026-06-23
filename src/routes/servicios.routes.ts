import { Router } from "express";
import {
  servicioController,
  authMiddleware,
  roleMiddleware,
} from "../container";

const router = Router();

// Todas requieren sesión válida
router.use(authMiddleware.authenticate);

// Lectura del catálogo: cualquier usuario logueado (veterinario, recepción…)
router.get("/", servicioController.getServicios);

// Gestión del catálogo (crear/editar/eliminar): solo Administrador
router.post("/", roleMiddleware.require("Admin"), servicioController.createServicio);
router.put("/:id", roleMiddleware.require("Admin"), servicioController.updateServicio);
router.delete(
  "/:id",
  roleMiddleware.require("Admin"),
  servicioController.deleteServicio,
);

export default router;
