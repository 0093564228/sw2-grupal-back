-- Quitar módulos de Laboratorio y Farmacia (recetas).
-- Se conservan Productos/Inventario/Kardex/Proveedores y Caja.

-- Quitar columna FK de Caja hacia órdenes de laboratorio
ALTER TABLE "DetalleCobro" DROP COLUMN "orden_lab_id";

-- Eliminar tablas (en orden de dependencias)
DROP TABLE "LaboratorioResultado";
DROP TABLE "DetalleReceta";
DROP TABLE "LaboratorioOrden";
DROP TABLE "CatalogoExamen";
DROP TABLE "RecetaMedica";

-- Quitar el valor LABORATORIO del enum TipoDetalleCobro
BEGIN;
CREATE TYPE "TipoDetalleCobro_new" AS ENUM ('SERVICIO', 'FARMACIA', 'SUMINISTRO');
ALTER TABLE "DetalleCobro" ALTER COLUMN "tipo" TYPE "TipoDetalleCobro_new" USING ("tipo"::text::"TipoDetalleCobro_new");
ALTER TYPE "TipoDetalleCobro" RENAME TO "TipoDetalleCobro_old";
ALTER TYPE "TipoDetalleCobro_new" RENAME TO "TipoDetalleCobro";
DROP TYPE "TipoDetalleCobro_old";
COMMIT;

-- Eliminar enums ya sin uso
DROP TYPE "EstadoExamen";
DROP TYPE "EntregaReceta";
