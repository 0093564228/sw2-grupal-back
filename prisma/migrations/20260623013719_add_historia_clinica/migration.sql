-- Historia Clínica (ficha de consulta externa) + evoluciones de tratamiento

CREATE TYPE "EstadoHistoria" AS ENUM ('BORRADOR', 'FINALIZADA');

CREATE TABLE "HistoriaClinica" (
    "id" TEXT NOT NULL,
    "folio" SERIAL NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mascota_id" TEXT NOT NULL,
    "ficha_id" TEXT,
    "atendido_por_id" TEXT,
    "propietario_nombre" TEXT,
    "domicilio" TEXT,
    "telefono" TEXT,
    "celular" TEXT,
    "edad" TEXT,
    "peso" DECIMAL(65,30),
    "motivo_consulta" TEXT,
    "vacunas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "vacunas_otras" TEXT,
    "desparasitacion" BOOLEAN NOT NULL DEFAULT false,
    "desparasitacion_cuando" TEXT,
    "enfermedades_previas" TEXT,
    "intervenciones_previas" TEXT,
    "estado_general" TEXT,
    "apetito" TEXT,
    "hidratacion" TEXT,
    "mucosa" TEXT,
    "ap_digestivo" TEXT,
    "ap_genitourinario" TEXT,
    "ap_respiratorio" TEXT,
    "temperatura" DECIMAL(65,30),
    "fc" INTEGER,
    "fr" INTEGER,
    "observacion_clinica" TEXT,
    "pruebas_complementarias" TEXT,
    "diagnostico_presuntivo" TEXT,
    "diagnostico_confirmativo" TEXT,
    "pronostico" TEXT,
    "tratamiento" TEXT,
    "estado" "EstadoHistoria" NOT NULL DEFAULT 'BORRADOR',
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalized_by_id" TEXT,
    "finalized_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "HistoriaClinica_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "HistoriaClinica_folio_key" ON "HistoriaClinica"("folio");
CREATE UNIQUE INDEX "HistoriaClinica_ficha_id_key" ON "HistoriaClinica"("ficha_id");

CREATE TABLE "EvolucionTratamiento" (
    "id" TEXT NOT NULL,
    "historia_id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "descripcion" TEXT NOT NULL,
    CONSTRAINT "EvolucionTratamiento_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "HistoriaClinica" ADD CONSTRAINT "HistoriaClinica_mascota_id_fkey" FOREIGN KEY ("mascota_id") REFERENCES "Mascota"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HistoriaClinica" ADD CONSTRAINT "HistoriaClinica_ficha_id_fkey" FOREIGN KEY ("ficha_id") REFERENCES "FichaAtencion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "HistoriaClinica" ADD CONSTRAINT "HistoriaClinica_atendido_por_id_fkey" FOREIGN KEY ("atendido_por_id") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "HistoriaClinica" ADD CONSTRAINT "HistoriaClinica_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "HistoriaClinica" ADD CONSTRAINT "HistoriaClinica_finalized_by_id_fkey" FOREIGN KEY ("finalized_by_id") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EvolucionTratamiento" ADD CONSTRAINT "EvolucionTratamiento_historia_id_fkey" FOREIGN KEY ("historia_id") REFERENCES "HistoriaClinica"("id") ON DELETE CASCADE ON UPDATE CASCADE;
