import { Router } from "express";
import { agendaController, roleMiddleware } from "../container";

const router = Router();

// Disponibilidad de horarios: la consultan tanto el personal como el propietario.
router.get("/disponibilidad", agendaController.getDisponibilidad);

// El propietario (CLIENTE) puede ver y solicitar citas para SUS mascotas.
// Estas rutas literales van antes que las de personal/parámetros.
router.get("/mis-citas", agendaController.getMisCitas);
router.get("/mis-mascotas", agendaController.getMisMascotas);
router.post("/solicitar", agendaController.solicitarCita);

// ── Rutas de personal (recepción / admin / veterinario) ──────────────────────
const soloPersonal = roleMiddleware.require(
  "Recepcionista",
  "Admin",
  "Veterinario",
);

router.get("/solicitudes", soloPersonal, agendaController.getSolicitudes);
router.get("/", soloPersonal, agendaController.getCitas);
router.post("/", soloPersonal, agendaController.createCita);
router.put("/:id", soloPersonal, agendaController.updateCita);
router.put("/:id/estado", soloPersonal, agendaController.updateEstado);
// Check-in convierte cita en ficha de atención: mismas restricciones que crear ficha
router.post("/:id/checkin", soloPersonal, agendaController.checkIn);
router.delete("/:id", soloPersonal, agendaController.deleteCita);

export default router;
