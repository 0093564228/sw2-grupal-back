import { Router } from "express";
import { mascotaController } from "../container";

const router = Router();

router.post("/", mascotaController.createMascota);
router.get("/", mascotaController.getMascotas);
router.get("/:id", mascotaController.getMascotaById);
router.put("/:id", mascotaController.updateMascota);
router.delete("/:id", mascotaController.deleteMascota);

export default router;
