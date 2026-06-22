import { Router } from "express";
import { dashboardController } from "../container";

const router = Router();

router.get("/kpis", dashboardController.getKpis);

export default router;
