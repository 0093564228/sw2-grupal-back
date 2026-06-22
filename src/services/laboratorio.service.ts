import { PrismaClient } from "@prisma/client";

const ordenInclude = {
  ficha: {
    include: {
      mascota: {
        include: { propietario: { select: { id: true, nombre: true } } },
      },
      doctor: { select: { id: true, nombre: true } },
    },
  },
  examen: true,
  resultado: true,
};

export class LaboratorioService {
  constructor(private readonly prisma: PrismaClient) {}

  private async genCodOrden() {
    const last = await this.prisma.laboratorioOrden.findFirst({
      orderBy: { created_at: "desc" },
      select: { cod_orden: true },
    });
    const num = last
      ? parseInt(last.cod_orden.replace("ORD-", ""), 10) || 0
      : 0;
    return `ORD-${String(num + 1).padStart(4, "0")}`;
  }

  async getOrdenes(estado?: string) {
    try {
      return await this.prisma.laboratorioOrden.findMany({
        where: estado
          ? { estado: estado as "SOLICITADO" | "EN_PROCESO" | "FINALIZADO" }
          : undefined,
        include: ordenInclude,
        orderBy: { created_at: "desc" },
      });
    } catch (err) {
      throw {
        status: 500,
        message: "Error al obtener las órdenes de laboratorio",
      };
    }
  }

  async getOrdenById(id: string) {
    try {
      return await this.prisma.laboratorioOrden.findUnique({
        where: { id },
        include: ordenInclude,
      });
    } catch (err) {
      throw {
        status: 500,
        message: "Error al obtener la orden de laboratorio",
      };
    }
  }

  async createOrden(data: {
    ficha_id: string;
    examen_id: string;
    prioridad?: "URGENTE" | "NORMAL";
  }) {
    try {
      const cod_orden = await this.genCodOrden();
      return await this.prisma.laboratorioOrden.create({
        data: { ...data, cod_orden },
        include: ordenInclude,
      });
    } catch (err) {
      throw { status: 500, message: "Error al crear la orden de laboratorio" };
    }
  }

  async updateEstadoOrden(id: string, estado: "EN_PROCESO" | "FINALIZADO") {
    try {
      return await this.prisma.laboratorioOrden.update({
        where: { id },
        data: { estado },
        include: ordenInclude,
      });
    } catch (err) {
      throw {
        status: 500,
        message: "Error al actualizar el estado de la orden",
      };
    }
  }

  async cargarResultado(
    orden_id: string,
    data: {
      hallazgos?: string;
      observaciones?: string;
      archivo_url?: string;
    },
  ) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const resultado = await tx.laboratorioResultado.upsert({
          where: { orden_id },
          create: { orden_id, ...data },
          update: data,
        });
        await tx.laboratorioOrden.update({
          where: { id: orden_id },
          data: { estado: "FINALIZADO" },
        });
        return resultado;
      });
    } catch (err) {
      throw {
        status: 500,
        message: "Error al cargar el resultado del laboratorio",
      };
    }
  }
}
