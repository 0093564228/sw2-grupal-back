import { Router } from "express";
import {
  historiaController,
  authMiddleware,
  roleMiddleware,
} from "../container";

const router = Router();

// Todas requieren sesión válida
router.use(authMiddleware.authenticate);

// Lectura (cualquier usuario logueado puede consultar el historial)
router.get("/", historiaController.list);
router.get("/:id", historiaController.getById);

// Escritura: solo personal clínico
router.post("/", roleMiddleware.require("Veterinario", "Admin"), historiaController.create);
router.patch(
  "/:id",
  roleMiddleware.require("Veterinario", "Admin"),
  historiaController.update,
);
router.post(
  "/:id/finalizar",
  roleMiddleware.require("Veterinario", "Admin"),
  historiaController.finalizar,
);
router.delete(
  "/:id",
  roleMiddleware.require("Veterinario", "Admin"),
  historiaController.remove,
);

export default router;
