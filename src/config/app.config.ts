import { Application } from "express";
import cors from "cors";

/**
 * Configura todos los middlewares de infraestructura de la aplicación Express.
 * Separado de app.ts para que cada responsabilidad esté en su propio módulo:
 * - app.config.ts → configura middleware
 * - app.ts        → compone la aplicación (monta rutas, exporta)
 */
export const configureApp = (app: Application): void => {
  const corsOptions = {
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    optionsSuccessStatus: 200,
  };

  app.use(cors(corsOptions));
  app.use(require("express").json());
  app.use(require("express").urlencoded({ extended: true }));
};
