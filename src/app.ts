// Carga las variables de entorno ANTES de cualquier import que las consuma.
// El composition root (container.ts, vía ./routes) lee process.env al instanciarse,
// por lo que dotenv debe ejecutarse primero — los imports corren en orden.
import "dotenv/config";
import express, { Application } from "express";
import { configureApp } from "./config/app.config";
import routes from "./routes";

const app: Application = express();

// Infraestructura: cors, parsers
configureApp(app);

// Rutas de la API
app.use("/api", routes);

export default app;
