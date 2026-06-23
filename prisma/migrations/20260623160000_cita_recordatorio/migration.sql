-- Marca si ya se envió el correo de recordatorio de una cita (evita duplicados).
ALTER TABLE "Cita" ADD COLUMN IF NOT EXISTS "recordatorio_enviado" BOOLEAN NOT NULL DEFAULT false;
