-- Landing pública: leads de contacto y suscripciones (pago Stripe).
DO $$ BEGIN
  CREATE TYPE "OrigenLead" AS ENUM ('CONTACTO', 'DEMO', 'PLAN', 'NEWSLETTER');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "EstadoSuscripcion" AS ENUM ('PENDIENTE', 'PAGADO', 'CANCELADO');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "Lead" (
  "id" TEXT NOT NULL,
  "nombre" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "telefono" TEXT,
  "empresa" TEXT,
  "mensaje" TEXT,
  "origen" "OrigenLead" NOT NULL DEFAULT 'CONTACTO',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Suscripcion" (
  "id" TEXT NOT NULL,
  "plan" TEXT NOT NULL,
  "nombre" TEXT,
  "email" TEXT,
  "monto" DECIMAL(65,30) NOT NULL DEFAULT 0,
  "moneda" TEXT NOT NULL DEFAULT 'usd',
  "estado" "EstadoSuscripcion" NOT NULL DEFAULT 'PENDIENTE',
  "stripe_session_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Suscripcion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Suscripcion_stripe_session_id_key" ON "Suscripcion"("stripe_session_id");
