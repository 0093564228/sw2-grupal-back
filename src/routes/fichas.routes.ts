import { Router } from "express";
import { fichaController, roleMiddleware } from "../container";

const router = Router();

router.get("/", fichaController.getFichas);
// Crear ficha: solo personal que registra pacientes (resto del flujo clínico queda solo con authenticate)
router.post(
  "/",
  roleMiddleware.require("Recepcionista", "Admin", "Veterinario"),
  fichaController.createFicha,
);
router.get("/:id", fichaController.getFichaById);
router.put("/:id", fichaController.updateFicha);
router.put("/:id/iniciar", fichaController.iniciarFicha);
router.put("/:id/completar", fichaController.completarFicha);
router.put("/:id/cancelar", fichaController.cancelarFicha);

// SOAP anidado en ficha
router.get("/:id/soap", fichaController.getSoap);
router.post("/:id/soap", fichaController.upsertSoap);
router.put("/:id/soap", fichaController.upsertSoap);

// Consumos/insumos usados en consulta
router.get("/:id/consumos", fichaController.getConsumos);
router.post("/:id/consumos", fichaController.addConsumo);
router.delete("/:id/consumos/:consumoId", fichaController.removeConsumo);

// Servicios realizados durante la consulta
router.get("/:id/servicios", fichaController.getServiciosRealizados);
router.post("/:id/servicios", fichaController.addServicioRealizado);
router.delete(
  "/:id/servicios/:servicioId",
  fichaController.removeServicioRealizado,
);

export default router;
