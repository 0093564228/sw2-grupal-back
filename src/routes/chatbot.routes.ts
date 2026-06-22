import { Router } from "express";
import { chatbotController } from "../container";

const router = Router();

router.post("/emergencia", chatbotController.handleEmergencyChat);

export default router;
