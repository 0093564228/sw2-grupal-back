-- Servicios realizados por consulta (seleccionados por el veterinario) + soft-delete del catálogo

ALTER TABLE "CatalogoServicio" ADD COLUMN "activo" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE "FichaServicio" (
    "id" TEXT NOT NULL,
    "ficha_id" TEXT NOT NULL,
    "servicio_id" TEXT NOT NULL,
    "precio" DECIMAL(65,30) NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FichaServicio_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "FichaServicio" ADD CONSTRAINT "FichaServicio_ficha_id_fkey" FOREIGN KEY ("ficha_id") REFERENCES "FichaAtencion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FichaServicio" ADD CONSTRAINT "FichaServicio_servicio_id_fkey" FOREIGN KEY ("servicio_id") REFERENCES "CatalogoServicio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
