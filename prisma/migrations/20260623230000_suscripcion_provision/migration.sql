-- Provisión de cuenta tras el pago (idempotente).
ALTER TABLE "Suscripcion" ADD COLUMN IF NOT EXISTS "cuenta_provisionada" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Suscripcion" ADD COLUMN IF NOT EXISTS "usuario_id" TEXT;
