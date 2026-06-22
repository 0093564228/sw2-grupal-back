import { Router } from "express";
import { usuariosController } from "../container";

const router = Router();

router.get("/", usuariosController.getUsuarios);
router.post("/", usuariosController.createUsuario);
router.get("/:id", usuariosController.getUsuarioById);
router.put("/:id", usuariosController.updateUsuario);
router.delete("/:id", usuariosController.deleteUsuario);

export default router;
