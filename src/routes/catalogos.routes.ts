import { Router } from "express";
import { catalogoController } from "../container";

const router = Router();

router.get("/especies", catalogoController.getEspecies);
router.get("/razas", catalogoController.getRazas);
router.get("/colores", catalogoController.getColores);
router.get("/alergias", catalogoController.getAlergias);
router.get("/servicios", catalogoController.getServicios);
router.get("/categorias", catalogoController.getCategorias);
router.get("/roles", catalogoController.getRoles);
router.get("/veterinarios", catalogoController.getVeterinarios);
router.get("/propietarios", catalogoController.getPropietarios);

export default router;
