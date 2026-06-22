import { Router } from "express";
import { farmaciaController } from "../container";

const router = Router();

router.get("/recetas", farmaciaController.getRecetasPendientes);
router.put("/recetas/:id/dispensar", farmaciaController.dispensarReceta);

export default router;
