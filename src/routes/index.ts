import { Router } from "express";
import authRoutes from "./auth.routes";
import mascotasRoutes from "./mascotas.routes";
import fichasRoutes from "./fichas.routes";
import consultoriosRoutes from "./consultorios.routes";
import productosRoutes from "./productos.routes";
import cajaRoutes from "./caja.routes";
import laboratorioRoutes from "./laboratorio.routes";
import catalogosRoutes from "./catalogos.routes";
import dashboardRoutes from "./dashboard.routes";
import usuariosRoutes from "./usuarios.routes";
import agendaRoutes from "./agenda.routes";
import chatbotRoutes from "./chatbot.routes";
import farmaciaRoutes from "./farmacia.routes";
import { authMiddleware, roleMiddleware } from "../container";

const router = Router();

// Públicas
router.use("/auth", authRoutes); // login público; register protegido dentro del archivo
router.use("/chatbot", chatbotRoutes); // asistente de emergencias de acceso público

// Solo requieren sesión válida (cualquier usuario logueado)
router.use("/dashboard", authMiddleware.authenticate, dashboardRoutes);
router.use("/mascotas", authMiddleware.authenticate, mascotasRoutes);
router.use("/fichas", authMiddleware.authenticate, fichasRoutes);
router.use("/catalogos", authMiddleware.authenticate, catalogosRoutes);
router.use("/agenda", authMiddleware.authenticate, agendaRoutes);
router.use("/laboratorio", authMiddleware.authenticate, laboratorioRoutes);
router.use("/farmacia", authMiddleware.authenticate, farmaciaRoutes);
router.use("/productos", authMiddleware.authenticate, productosRoutes);

// Solo Administrador (todo el router)
router.use(
  "/usuarios",
  authMiddleware.authenticate,
  roleMiddleware.require("Admin"),
  usuariosRoutes,
);

// Protección mixta (authenticate global + requireRole por ruta, definido en el archivo)
router.use("/consultorios", consultoriosRoutes);
router.use("/caja", cajaRoutes);

export default router;
