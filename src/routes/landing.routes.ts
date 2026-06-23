import { Router } from "express";
import {
  landingController,
  authMiddleware,
  roleMiddleware,
} from "../container";
import { rateLimit } from "../middlewares/rateLimit.middleware";

const router = Router();

// Anti-spam: máx. 8 envíos por minuto por IP en los formularios públicos.
const limiter = rateLimit({ windowMs: 60_000, max: 8 });

// Públicas (landing)
router.post("/leads", limiter, landingController.crearLead);
router.post("/checkout", limiter, landingController.crearCheckout);
router.get("/checkout/verify", landingController.verificarCheckout);

// Solo Administrador: ver solicitudes y suscripciones recibidas
router.get(
  "/leads",
  authMiddleware.authenticate,
  roleMiddleware.require("Admin"),
  landingController.getLeads,
);
router.get(
  "/suscripciones",
  authMiddleware.authenticate,
  roleMiddleware.require("Admin"),
  landingController.getSuscripciones,
);

export default router;
