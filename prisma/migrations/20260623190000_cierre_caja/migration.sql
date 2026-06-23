-- Arqueo y cierre de caja por turno del cajero.
CREATE TABLE IF NOT EXISTS "CierreCaja" (
  "id" TEXT NOT NULL,
  "cajero_id" TEXT NOT NULL,
  "fecha_desde" TIMESTAMP(3) NOT NULL,
  "fecha_hasta" TIMESTAMP(3) NOT NULL,
  "total_efectivo" DECIMAL(65,30) NOT NULL DEFAULT 0,
  "total_tarjeta" DECIMAL(65,30) NOT NULL DEFAULT 0,
  "total_qr" DECIMAL(65,30) NOT NULL DEFAULT 0,
  "total_general" DECIMAL(65,30) NOT NULL DEFAULT 0,
  "cantidad_recibos" INTEGER NOT NULL DEFAULT 0,
  "efectivo_contado" DECIMAL(65,30),
  "diferencia" DECIMAL(65,30),
  "observaciones" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CierreCaja_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "CierreCaja"
    ADD CONSTRAINT "CierreCaja_cajero_id_fkey"
    FOREIGN KEY ("cajero_id") REFERENCES "Usuario"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
