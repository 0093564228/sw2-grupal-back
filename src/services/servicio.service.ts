import { PrismaClient } from "@prisma/client";

export class ServicioService {
  constructor(private readonly prisma: PrismaClient) {}

  async getServicios(soloActivos = false) {
    try {
      return await this.prisma.catalogoServicio.findMany({
        where: soloActivos ? { activo: true } : {},
        orderBy: { nombre: "asc" },
      });
    } catch (err) {
      throw { status: 500, message: "Error al obtener los servicios" };
    }
  }

  async createServicio(data: { nombre: string; precio_base: number }) {
    try {
      if (!data.nombre?.trim()) {
        throw { status: 400, message: "El nombre del servicio es obligatorio" };
      }
      if (data.precio_base == null || Number(data.precio_base) < 0) {
        throw { status: 400, message: "El precio debe ser un valor válido" };
      }
      return await this.prisma.catalogoServicio.create({
        data: {
          nombre: data.nombre.trim(),
          precio_base: data.precio_base,
        },
      });
    } catch (err: any) {
      if (err?.code === "P2002") {
        throw { status: 409, message: "Ya existe un servicio con ese nombre" };
      }
      throw {
        status: err?.status || 500,
        message: err?.message || "Error al crear el servicio",
      };
    }
  }

  async updateServicio(
    id: string,
    data: { nombre?: string; precio_base?: number; activo?: boolean },
  ) {
    try {
      return await this.prisma.catalogoServicio.update({
        where: { id },
        data: {
          ...(data.nombre !== undefined && { nombre: data.nombre.trim() }),
          ...(data.precio_base !== undefined && {
            precio_base: data.precio_base,
          }),
          ...(data.activo !== undefined && { activo: data.activo }),
        },
      });
    } catch (err: any) {
      if (err?.code === "P2002") {
        throw { status: 409, message: "Ya existe un servicio con ese nombre" };
      }
      throw {
        status: err?.status || 500,
        message: err?.message || "Error al actualizar el servicio",
      };
    }
  }

  async deleteServicio(id: string) {
    try {
      // Si el servicio ya se usó en fichas o cobros, no se puede borrar (FK):
      // en ese caso se DESACTIVA para conservar el historial.
      const [enFichas, enRealizados] = await Promise.all([
        this.prisma.fichaAtencion.count({ where: { servicio_id: id } }),
        this.prisma.fichaServicio.count({ where: { servicio_id: id } }),
      ]);
      if (enFichas > 0 || enRealizados > 0) {
        return await this.prisma.catalogoServicio.update({
          where: { id },
          data: { activo: false },
        });
      }
      return await this.prisma.catalogoServicio.delete({ where: { id } });
    } catch (err: any) {
      throw {
        status: err?.status || 500,
        message: err?.message || "Error al eliminar el servicio",
      };
    }
  }
}
