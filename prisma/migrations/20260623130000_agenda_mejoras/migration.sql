-- Mejoras de Agenda: duración y tipo de cita, y estado SOLICITADA (solicitud del propietario).

-- AlterEnum: nuevo estado para solicitudes de cita en línea del propietario
ALTER TYPE "EstadoCita" ADD VALUE IF NOT EXISTS 'SOLICITADA';

-- CreateEnum: tipo de cita
DO $$ BEGIN
  CREATE TYPE "TipoCita" AS ENUM ('CONSULTA', 'CONTROL', 'VACUNACION', 'CIRUGIA', 'PELUQUERIA', 'OTRO');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AlterTable: duración y tipo en Cita
ALTER TABLE "Cita" ADD COLUMN IF NOT EXISTS "duracion_min" INTEGER NOT NULL DEFAULT 30;
ALTER TABLE "Cita" ADD COLUMN IF NOT EXISTS "tipo" "TipoCita" NOT NULL DEFAULT 'CONSULTA';
