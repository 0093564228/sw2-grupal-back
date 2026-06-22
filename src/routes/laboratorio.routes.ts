import { Router } from "express";
import { laboratorioController } from "../container";

const router = Router();

router.get("/", laboratorioController.getOrdenes);
router.post("/", laboratorioController.createOrden);
router.get("/:id", laboratorioController.getOrdenById);
router.put("/:id/estado", laboratorioController.updateEstado);
router.post("/:id/resultado", laboratorioController.cargarResultado);

export default router;
