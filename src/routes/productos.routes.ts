import { Router } from "express";
import { productoController } from "../container";

const router = Router();

router.get("/", productoController.getProductos);
router.post("/", productoController.createProducto);
router.get("/:id", productoController.getProductoById);
router.put("/:id", productoController.updateProducto);
router.delete("/:id", productoController.deleteProducto);
router.post("/:id/stock", productoController.ajustarStock);

export default router;
