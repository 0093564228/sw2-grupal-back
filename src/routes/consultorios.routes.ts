import { Router } from "express";
import {
  consultorioController,
  authMiddleware,
  roleMiddleware,
} from "../container";

const router = Router();

// Todas las rutas requieren sesión válida
router.use(authMiddleware.authenticate);

// Lectura y cambio de estado operativo: cualquier usuario logueado
router.get("/", consultorioController.getConsultorios);
router.put("/:id/estado", consultorioController.updateEstado);

// Gestión del catálogo de salas (crear/editar/borrar): solo Administrador
router.post(
  "/",
  roleMiddleware.require("Admin"),
  consultorioController.createConsultorio,
);
router.put(
  "/:id",
  roleMiddleware.require("Admin"),
  consultorioController.updateConsultorio,
);
router.delete(
  "/:id",
  roleMiddleware.require("Admin"),
  consultorioController.deleteConsultorio,
);

export default router;
