-- CreateEnum
CREATE TYPE "TipoSala" AS ENUM ('CONSULTORIO', 'LABORATORIO', 'QUIROFANO', 'SALA_ESPERA', 'OTRO');

-- CreateEnum
CREATE TYPE "ConsultorioEstado" AS ENUM ('LIBRE', 'OCUPADO', 'LIMPIEZA');

-- CreateEnum
CREATE TYPE "EstadoCita" AS ENUM ('PROGRAMADA', 'CONFIRMADA', 'COMPLETADA', 'CANCELADA', 'NO_ASISTIO');

-- CreateEnum
CREATE TYPE "EstadoFicha" AS ENUM ('ESPERA', 'EN_CURSO', 'COMPLETADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "Prioridad" AS ENUM ('URGENTE', 'NORMAL');

-- CreateEnum
CREATE TYPE "EstadoCobro" AS ENUM ('PENDIENTE', 'PAGADO', 'EXENTO');

-- CreateEnum
CREATE TYPE "TipoProducto" AS ENUM ('MEDICAMENTO', 'INSUMO_MEDICO', 'VACUNA', 'ALIMENTO');

-- CreateEnum
CREATE TYPE "EntregaReceta" AS ENUM ('PENDIENTE', 'ENTREGADO', 'PARCIAL');

-- CreateEnum
CREATE TYPE "EstadoCompra" AS ENUM ('EN_TRANSITO', 'COMPLETADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "TipoMovimiento" AS ENUM ('INGRESO', 'SALIDA');

-- CreateEnum
CREATE TYPE "EstadoExamen" AS ENUM ('SOLICITADO', 'EN_PROCESO', 'FINALIZADO');

-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('EFECTIVO', 'TARJETA', 'QR');

-- CreateEnum
CREATE TYPE "EstadoRecibo" AS ENUM ('EMITIDO', 'PAGADO', 'ANULADO');

-- CreateEnum
CREATE TYPE "TipoDetalleCobro" AS ENUM ('SERVICIO', 'LABORATORIO', 'FARMACIA', 'SUMINISTRO');

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "permisos" JSONB,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "telefono" TEXT,
    "ci" TEXT,
    "rol_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "debe_cambiar_password" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Especie" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "Especie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Raza" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "especie_id" TEXT NOT NULL,

    CONSTRAINT "Raza_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ColorMascota" (
    "id" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,

    CONSTRAINT "ColorMascota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alergia" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "Alergia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogoServicio" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "precio_base" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "CatalogoServicio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mascota" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "especie_id" TEXT NOT NULL,
    "raza_id" TEXT,
    "color_id" TEXT,
    "fecha_nacimiento" TIMESTAMP(3),
    "sexo" CHAR(1),
    "peso_actual" DECIMAL(65,30),
    "esterilizado" BOOLEAN NOT NULL DEFAULT false,
    "propietario_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Mascota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PacienteAlergia" (
    "mascota_id" TEXT NOT NULL,
    "alergia_id" TEXT NOT NULL,
    "severidad" TEXT NOT NULL,

    CONSTRAINT "PacienteAlergia_pkey" PRIMARY KEY ("mascota_id","alergia_id")
);

-- CreateTable
CREATE TABLE "Consultorio" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "especialidad" TEXT,
    "tipo" "TipoSala" NOT NULL DEFAULT 'CONSULTORIO',
    "estado" "ConsultorioEstado" NOT NULL DEFAULT 'LIBRE',
    "responsable_id" TEXT,

    CONSTRAINT "Consultorio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FichaAtencion" (
    "id" TEXT NOT NULL,
    "cod_ficha" TEXT NOT NULL,
    "mascota_id" TEXT NOT NULL,
    "doctor_id" TEXT,
    "consultorio_id" TEXT,
    "servicio_id" TEXT NOT NULL,
    "creado_por_id" TEXT,
    "motivo" TEXT,
    "estado" "EstadoFicha" NOT NULL DEFAULT 'ESPERA',
    "prioridad" "Prioridad" NOT NULL DEFAULT 'NORMAL',
    "estado_cobro" "EstadoCobro" NOT NULL DEFAULT 'PENDIENTE',
    "fecha_hora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FichaAtencion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cita" (
    "id" TEXT NOT NULL,
    "mascota_id" TEXT NOT NULL,
    "doctor_id" TEXT,
    "consultorio_id" TEXT,
    "fecha_hora" TIMESTAMP(3) NOT NULL,
    "motivo" TEXT NOT NULL,
    "notas" TEXT,
    "estado" "EstadoCita" NOT NULL DEFAULT 'PROGRAMADA',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cita_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistroSOAP" (
    "id" TEXT NOT NULL,
    "ficha_id" TEXT NOT NULL,
    "motivo_detalle" TEXT,
    "anamnesis" TEXT,
    "peso" DECIMAL(65,30),
    "temperatura" DECIMAL(65,30),
    "fc" INTEGER,
    "fr" INTEGER,
    "hallazgos" TEXT,
    "diagnostico" TEXT,
    "tratamiento" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegistroSOAP_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoriaProducto" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo_item" "TipoProducto" NOT NULL DEFAULT 'MEDICAMENTO',

    CONSTRAINT "CategoriaProducto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Producto" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "categoria_id" TEXT,
    "precio_venta" DECIMAL(65,30) NOT NULL,
    "stock_actual" INTEGER NOT NULL DEFAULT 0,
    "stock_minimo" INTEGER NOT NULL DEFAULT 5,

    CONSTRAINT "Producto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsumoConsulta" (
    "id" TEXT NOT NULL,
    "ficha_id" TEXT NOT NULL,
    "producto_id" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsumoConsulta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecetaMedica" (
    "id" TEXT NOT NULL,
    "soap_id" TEXT NOT NULL,
    "indicaciones" TEXT,
    "estado_entrega" "EntregaReceta" NOT NULL DEFAULT 'PENDIENTE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecetaMedica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DetalleReceta" (
    "id" TEXT NOT NULL,
    "receta_id" TEXT NOT NULL,
    "producto_id" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "instrucciones" TEXT,

    CONSTRAINT "DetalleReceta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proveedor" (
    "id" TEXT NOT NULL,
    "nombre_empresa" TEXT NOT NULL,
    "nit" TEXT,
    "contacto" TEXT,
    "telefono" TEXT,

    CONSTRAINT "Proveedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompraProveedor" (
    "id" TEXT NOT NULL,
    "proveedor_id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "monto_total" DECIMAL(65,30) NOT NULL,
    "estado" "EstadoCompra" NOT NULL DEFAULT 'EN_TRANSITO',
    "notas" TEXT,

    CONSTRAINT "CompraProveedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KardexMovimiento" (
    "id" TEXT NOT NULL,
    "producto_id" TEXT NOT NULL,
    "tipo" "TipoMovimiento" NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "saldo_final" INTEGER NOT NULL,
    "motivo" TEXT,
    "compra_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KardexMovimiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogoExamen" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo_muestra" TEXT,
    "precio" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "CatalogoExamen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LaboratorioOrden" (
    "id" TEXT NOT NULL,
    "cod_orden" TEXT NOT NULL,
    "ficha_id" TEXT NOT NULL,
    "examen_id" TEXT NOT NULL,
    "estado" "EstadoExamen" NOT NULL DEFAULT 'SOLICITADO',
    "prioridad" "Prioridad" NOT NULL DEFAULT 'NORMAL',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LaboratorioOrden_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LaboratorioResultado" (
    "id" TEXT NOT NULL,
    "orden_id" TEXT NOT NULL,
    "hallazgos" TEXT,
    "observaciones" TEXT,
    "archivo_url" TEXT,
    "fecha_procesado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LaboratorioResultado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PuntoCaja" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "ubicacion" TEXT,

    CONSTRAINT "PuntoCaja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReciboCaja" (
    "id" TEXT NOT NULL,
    "num_recibo" TEXT NOT NULL,
    "ficha_id" TEXT,
    "cajero_id" TEXT NOT NULL,
    "nombre_cliente" TEXT,
    "punto_caja_id" TEXT,
    "total" DECIMAL(65,30) NOT NULL,
    "metodo_pago" "MetodoPago" NOT NULL DEFAULT 'EFECTIVO',
    "monto_recibido" DECIMAL(65,30),
    "cambio_devuelto" DECIMAL(65,30),
    "estado" "EstadoRecibo" NOT NULL DEFAULT 'EMITIDO',
    "motivo_anulacion" TEXT,
    "fecha_pago" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReciboCaja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DetalleCobro" (
    "id" TEXT NOT NULL,
    "recibo_id" TEXT NOT NULL,
    "tipo" "TipoDetalleCobro" NOT NULL,
    "descripcion" TEXT NOT NULL,
    "precio_unit" DECIMAL(65,30) NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 1,
    "subtotal" DECIMAL(65,30) NOT NULL,
    "orden_lab_id" TEXT,
    "producto_id" TEXT,

    CONSTRAINT "DetalleCobro_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_nombre_key" ON "Role"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Especie_nombre_key" ON "Especie"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Raza_nombre_especie_id_key" ON "Raza"("nombre", "especie_id");

-- CreateIndex
CREATE UNIQUE INDEX "ColorMascota_descripcion_key" ON "ColorMascota"("descripcion");

-- CreateIndex
CREATE UNIQUE INDEX "Alergia_nombre_key" ON "Alergia"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogoServicio_nombre_key" ON "CatalogoServicio"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "FichaAtencion_cod_ficha_key" ON "FichaAtencion"("cod_ficha");

-- CreateIndex
CREATE UNIQUE INDEX "RegistroSOAP_ficha_id_key" ON "RegistroSOAP"("ficha_id");

-- CreateIndex
CREATE UNIQUE INDEX "CategoriaProducto_nombre_key" ON "CategoriaProducto"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "RecetaMedica_soap_id_key" ON "RecetaMedica"("soap_id");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogoExamen_nombre_key" ON "CatalogoExamen"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "LaboratorioOrden_cod_orden_key" ON "LaboratorioOrden"("cod_orden");

-- CreateIndex
CREATE UNIQUE INDEX "LaboratorioResultado_orden_id_key" ON "LaboratorioResultado"("orden_id");

-- CreateIndex
CREATE UNIQUE INDEX "PuntoCaja_nombre_key" ON "PuntoCaja"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "ReciboCaja_num_recibo_key" ON "ReciboCaja"("num_recibo");

-- CreateIndex
CREATE UNIQUE INDEX "ReciboCaja_ficha_id_key" ON "ReciboCaja"("ficha_id");

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Raza" ADD CONSTRAINT "Raza_especie_id_fkey" FOREIGN KEY ("especie_id") REFERENCES "Especie"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mascota" ADD CONSTRAINT "Mascota_especie_id_fkey" FOREIGN KEY ("especie_id") REFERENCES "Especie"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mascota" ADD CONSTRAINT "Mascota_raza_id_fkey" FOREIGN KEY ("raza_id") REFERENCES "Raza"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mascota" ADD CONSTRAINT "Mascota_color_id_fkey" FOREIGN KEY ("color_id") REFERENCES "ColorMascota"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mascota" ADD CONSTRAINT "Mascota_propietario_id_fkey" FOREIGN KEY ("propietario_id") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PacienteAlergia" ADD CONSTRAINT "PacienteAlergia_mascota_id_fkey" FOREIGN KEY ("mascota_id") REFERENCES "Mascota"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PacienteAlergia" ADD CONSTRAINT "PacienteAlergia_alergia_id_fkey" FOREIGN KEY ("alergia_id") REFERENCES "Alergia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consultorio" ADD CONSTRAINT "Consultorio_responsable_id_fkey" FOREIGN KEY ("responsable_id") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FichaAtencion" ADD CONSTRAINT "FichaAtencion_mascota_id_fkey" FOREIGN KEY ("mascota_id") REFERENCES "Mascota"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FichaAtencion" ADD CONSTRAINT "FichaAtencion_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FichaAtencion" ADD CONSTRAINT "FichaAtencion_consultorio_id_fkey" FOREIGN KEY ("consultorio_id") REFERENCES "Consultorio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FichaAtencion" ADD CONSTRAINT "FichaAtencion_servicio_id_fkey" FOREIGN KEY ("servicio_id") REFERENCES "CatalogoServicio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FichaAtencion" ADD CONSTRAINT "FichaAtencion_creado_por_id_fkey" FOREIGN KEY ("creado_por_id") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cita" ADD CONSTRAINT "Cita_mascota_id_fkey" FOREIGN KEY ("mascota_id") REFERENCES "Mascota"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cita" ADD CONSTRAINT "Cita_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cita" ADD CONSTRAINT "Cita_consultorio_id_fkey" FOREIGN KEY ("consultorio_id") REFERENCES "Consultorio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroSOAP" ADD CONSTRAINT "RegistroSOAP_ficha_id_fkey" FOREIGN KEY ("ficha_id") REFERENCES "FichaAtencion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "CategoriaProducto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsumoConsulta" ADD CONSTRAINT "ConsumoConsulta_ficha_id_fkey" FOREIGN KEY ("ficha_id") REFERENCES "FichaAtencion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsumoConsulta" ADD CONSTRAINT "ConsumoConsulta_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecetaMedica" ADD CONSTRAINT "RecetaMedica_soap_id_fkey" FOREIGN KEY ("soap_id") REFERENCES "RegistroSOAP"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetalleReceta" ADD CONSTRAINT "DetalleReceta_receta_id_fkey" FOREIGN KEY ("receta_id") REFERENCES "RecetaMedica"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetalleReceta" ADD CONSTRAINT "DetalleReceta_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompraProveedor" ADD CONSTRAINT "CompraProveedor_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "Proveedor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KardexMovimiento" ADD CONSTRAINT "KardexMovimiento_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KardexMovimiento" ADD CONSTRAINT "KardexMovimiento_compra_id_fkey" FOREIGN KEY ("compra_id") REFERENCES "CompraProveedor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LaboratorioOrden" ADD CONSTRAINT "LaboratorioOrden_ficha_id_fkey" FOREIGN KEY ("ficha_id") REFERENCES "FichaAtencion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LaboratorioOrden" ADD CONSTRAINT "LaboratorioOrden_examen_id_fkey" FOREIGN KEY ("examen_id") REFERENCES "CatalogoExamen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LaboratorioResultado" ADD CONSTRAINT "LaboratorioResultado_orden_id_fkey" FOREIGN KEY ("orden_id") REFERENCES "LaboratorioOrden"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReciboCaja" ADD CONSTRAINT "ReciboCaja_ficha_id_fkey" FOREIGN KEY ("ficha_id") REFERENCES "FichaAtencion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReciboCaja" ADD CONSTRAINT "ReciboCaja_cajero_id_fkey" FOREIGN KEY ("cajero_id") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReciboCaja" ADD CONSTRAINT "ReciboCaja_punto_caja_id_fkey" FOREIGN KEY ("punto_caja_id") REFERENCES "PuntoCaja"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetalleCobro" ADD CONSTRAINT "DetalleCobro_recibo_id_fkey" FOREIGN KEY ("recibo_id") REFERENCES "ReciboCaja"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetalleCobro" ADD CONSTRAINT "DetalleCobro_orden_lab_id_fkey" FOREIGN KEY ("orden_lab_id") REFERENCES "LaboratorioOrden"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetalleCobro" ADD CONSTRAINT "DetalleCobro_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "Producto"("id") ON DELETE SET NULL ON UPDATE CASCADE;
