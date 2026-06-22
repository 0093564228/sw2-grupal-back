import { Router } from "express";
import { agendaController, roleMiddleware } from "../container";

const router = Router();

router.get("/", agendaController.getCitas);
router.post("/", agendaController.createCita);
router.put("/:id", agendaController.updateCita);
router.put("/:id/estado", agendaController.updateEstado);
// Check-in convierte cita en ficha de atención: mismas restricciones que crear ficha
router.post(
  "/:id/checkin",
  roleMiddleware.require("Recepcionista", "Admin", "Veterinario"),
  agendaController.checkIn,
);
router.delete("/:id", agendaController.deleteCita);

export default router;
