import { PrismaClient } from "@prisma/client";

export class FarmaciaService {
  constructor(private readonly prisma: PrismaClient) {}

  /** Recetas pagadas pendientes de entrega */
  async getRecetasPendientes() {
    try {
      return await this.prisma.recetaMedica.findMany({
        where: {
          estado_entrega: "PENDIENTE",
          soap: { ficha: { estado_cobro: "PAGADO" } },
        },
        include: {
          detalles: { include: { producto: true } },
          soap: {
            include: {
              ficha: {
                include: {
                  mascota: {
                    include: {
                      propietario: { select: { id: true, nombre: true } },
                    },
                  },
                  servicio: true,
                },
              },
            },
          },
        },
        orderBy: { created_at: "asc" },
      });
    } catch (err) {
      throw { status: 500, message: "Error al obtener las recetas pendientes" };
    }
  }

  /** Dispensar una receta: descuenta stock y marca como ENTREGADO */
  async dispensarReceta(receta_id: string, farmaceutico_id: string) {
    try {
      const receta = await this.prisma.recetaMedica.findUniqueOrThrow({
        where: { id: receta_id },
        include: { detalles: { include: { producto: true } } },
      });

      if (receta.estado_entrega === "ENTREGADO") {
        throw { status: 400, message: "Esta receta ya fue entregada" };
      }

      return await this.prisma.$transaction(async (tx) => {
        for (const det of receta.detalles) {
          const prod = await tx.producto.findUniqueOrThrow({
            where: { id: det.producto_id },
          });
          if (prod.stock_actual < det.cantidad) {
            throw {
              status: 400,
              message: `Stock insuficiente para ${prod.nombre} (disponible: ${prod.stock_actual}, requerido: ${det.cantidad})`,
            };
          }
          const nuevo = prod.stock_actual - det.cantidad;
          await tx.producto.update({
            where: { id: det.producto_id },
            data: { stock_actual: nuevo },
          });
          await tx.kardexMovimiento.create({
            data: {
              producto_id: det.producto_id,
              tipo: "SALIDA",
              cantidad: det.cantidad,
              saldo_final: nuevo,
              motivo: `Dispensado receta ${receta_id} por ${farmaceutico_id}`,
            },
          });
        }

        // También descontar insumos usados en consulta (ConsumoConsulta) vinculados a la misma ficha
        const soap = await tx.registroSOAP.findUnique({
          where: { id: receta.soap_id },
          select: { ficha_id: true },
        });
        if (soap) {
          const consumos = await tx.consumoConsulta.findMany({
            where: { ficha_id: soap.ficha_id },
            include: { producto: true },
          });
          for (const cons of consumos) {
            const prod = await tx.producto.findUniqueOrThrow({
              where: { id: cons.producto_id },
            });
            if (prod.stock_actual < cons.cantidad) {
              throw {
                status: 400,
                message: `Stock insuficiente para insumo ${prod.nombre}`,
              };
            }
            const nuevo = prod.stock_actual - cons.cantidad;
            await tx.producto.update({
              where: { id: cons.producto_id },
              data: { stock_actual: nuevo },
            });
            await tx.kardexMovimiento.create({
              data: {
                producto_id: cons.producto_id,
                tipo: "SALIDA",
                cantidad: cons.cantidad,
                saldo_final: nuevo,
                motivo: `Insumo consulta, receta ${receta_id}`,
              },
            });
          }
        }

        return await tx.recetaMedica.update({
          where: { id: receta_id },
          data: { estado_entrega: "ENTREGADO" },
          include: { detalles: { include: { producto: true } } },
        });
      });
    } catch (err: any) {
      throw {
        status: err?.status || 500,
        message: err?.message || "Error al dispensar la receta",
      };
    }
  }
}
