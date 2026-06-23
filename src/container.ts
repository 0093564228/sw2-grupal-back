/**
 * COMPOSITION ROOT (contenedor de inyección de dependencias).
 *
 * Único lugar donde se instancian las clases del backend y se cablean sus
 * dependencias. Aquí vive todo el conocimiento sobre "cómo se construye" cada
 * pieza; el resto del código solo recibe instancias por constructor (DI puro,
 * sin librerías ni decoradores).
 *
 * Orden de instanciación: primero la infraestructura (prisma, token, password,
 * error), luego los servicios respetando sus dependencias entre sí, después los
 * middlewares y finalmente los controllers. Las rutas importan las instancias
 * exportadas desde este archivo.
 */
import prisma from "./config/db";

// ── Infraestructura ──
import { TokenService } from "./services/token.service";
import { PasswordService } from "./services/password.service";
import { ErrorHandler } from "./middlewares/error.middleware";
import { AuthMiddleware } from "./middlewares/auth.middleware";
import { RoleMiddleware } from "./middlewares/role.middleware";

// ── Servicios ──
import { AuthService } from "./services/auth.service";
import { UsuariosService } from "./services/usuarios.service";
import { MascotaService } from "./services/mascota.service";
import { FichaService } from "./services/ficha.service";
import { AgendaService } from "./services/agenda.service";
import { MailService } from "./services/mail.service";
import { CajaService } from "./services/caja.service";
import { CatalogoService } from "./services/catalogo.service";
import { ConsultorioService } from "./services/consultorio.service";
import { DashboardService } from "./services/dashboard.service";
import { ProductoService } from "./services/producto.service";
import { ServicioService } from "./services/servicio.service";
import { HistoriaService } from "./services/historia.service";
import { ChatbotService } from "./services/chatbot.service";

// ── Controllers ──
import { AuthController } from "./controllers/auth.controller";
import { UsuariosController } from "./controllers/usuarios.controller";
import { MascotaController } from "./controllers/mascota.controller";
import { FichaController } from "./controllers/ficha.controller";
import { AgendaController } from "./controllers/agenda.controller";
import { CajaController } from "./controllers/caja.controller";
import { CatalogoController } from "./controllers/catalogo.controller";
import { ConsultorioController } from "./controllers/consultorio.controller";
import { DashboardController } from "./controllers/dashboard.controller";
import { ProductoController } from "./controllers/producto.controller";
import { ServicioController } from "./controllers/servicio.controller";
import { HistoriaController } from "./controllers/historia.controller";
import { ChatbotController } from "./controllers/chatbot.controller";

// ─── Infraestructura ──────────────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error(
    "JWT_SECRET no está definido en las variables de entorno. El servidor no puede arrancar sin un secreto real.",
  );
}

const tokenService = new TokenService(JWT_SECRET);
const passwordService = new PasswordService();
const errorHandler = new ErrorHandler();

// ─── Servicios (instanciados respetando el grafo de dependencias) ──────────────
const usuariosService = new UsuariosService(prisma, passwordService);
const fichaService = new FichaService(prisma);
const mascotaService = new MascotaService(prisma, usuariosService);
const mailService = new MailService({
  user: process.env.SMTP_USER,
  pass: process.env.SMTP_PASS,
  from: process.env.MAIL_FROM,
});
const agendaService = new AgendaService(prisma, fichaService, mailService);
const authService = new AuthService(prisma, tokenService, passwordService);
const cajaService = new CajaService(prisma);
const catalogoService = new CatalogoService(prisma);
const consultorioService = new ConsultorioService(prisma);
const dashboardService = new DashboardService(prisma);
const productoService = new ProductoService(prisma);
const servicioService = new ServicioService(prisma);
const historiaService = new HistoriaService(prisma);
const chatbotService = new ChatbotService(process.env.OPENAI_API_KEY || "");

// ─── Middlewares ───────────────────────────────────────────────────────────────
export const authMiddleware = new AuthMiddleware(tokenService);
export const roleMiddleware = new RoleMiddleware();

// ─── Controllers (reciben su servicio + el manejador de errores) ───────────────
export const authController = new AuthController(authService, errorHandler);
export const usuariosController = new UsuariosController(
  usuariosService,
  errorHandler,
);
export const mascotaController = new MascotaController(
  mascotaService,
  errorHandler,
);
export const fichaController = new FichaController(fichaService, errorHandler);
export const agendaController = new AgendaController(
  agendaService,
  errorHandler,
);
export const cajaController = new CajaController(cajaService, errorHandler);
export const catalogoController = new CatalogoController(
  catalogoService,
  errorHandler,
);
export const consultorioController = new ConsultorioController(
  consultorioService,
  errorHandler,
);
export const dashboardController = new DashboardController(
  dashboardService,
  errorHandler,
);
export const productoController = new ProductoController(
  productoService,
  errorHandler,
);
export const servicioController = new ServicioController(
  servicioService,
  errorHandler,
);
export const historiaController = new HistoriaController(
  historiaService,
  errorHandler,
);
export const chatbotController = new ChatbotController(
  chatbotService,
  errorHandler,
);
