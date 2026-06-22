import { PrismaClient } from "@prisma/client";
import { UsuariosService } from "./usuarios.service";
import { CreateMascotaConPropietarioDto, UpdateMascotaDto } from "../types";

const mascotaInclude = {
  especie: true,
  raza: true,
  color: true,
  propietario: {
    select: { id: true, nombre: true, email: true, telefono: true, ci: true },
  },
  alergias: { include: { alergia: true } },
  fichas: {
    orderBy: { fecha_hora: "desc" as const },
    take: 20,
    include: {
      servicio: true,
      doctor: { select: { id: true, nombre: true } },
      consultorio: { select: { nombre: true } },
      soap: { select: { diagnostico: true, tratamiento: true } },
      recibo: {
        select: {
          id: true,
          num_recibo: true,
          total: true,
          metodo_pago: true,
          fecha_pago: true,
          estado: true,
        },
      },
    },
  },
};

export class MascotaService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly usuariosService: UsuariosService,
  ) {}

  async getMascotas(search?: string, propietario_id?: string) {
    try {
      return await this.prisma.mascota.findMany({
        where: {
          ...(propietario_id ? { propietario_id } : {}),
          ...(search
            ? {
                OR: [
                  { nombre: { contains: search, mode: "insensitive" } },
                  {
                    propietario: {
                      nombre: { contains: search, mode: "insensitive" },
                    },
                  },
                  {
                    propietario: {
                      email: { contains: search, mode: "insensitive" },
                    },
                  },
                  {
                    propietario: {
                      ci: { contains: search, mode: "insensitive" },
                    },
                  },
                ],
              }
            : {}),
        },
        include: mascotaInclude,
        orderBy: { nombre: "asc" },
      });
    } catch (err) {
      throw { status: 500, message: "Error al obtener las mascotas" };
    }
  }

  async getMascotaById(id: string) {
    try {
      return await this.prisma.mascota.findUnique({
        where: { id },
        include: mascotaInclude,
      });
    } catch (err) {
      throw { status: 500, message: "Error al obtener la mascota" };
    }
  }

  /**
   * Crea una mascota vinculándola a un propietario existente o creando uno nuevo.
   * La lógica de creación del propietario (usuario) se delega completamente a
   * usuariosService.findOrCreateCliente() — alta cohesión, bajo acoplamiento.
   */
  async createMascotaConPropietario(data: CreateMascotaConPropietarioDto) {
    try {
      let propietarioId: string;

      if (data.propietario_id) {
        // Propietario ya existe: solo verificamos que existe
        const existing = await this.prisma.usuario.findUnique({
          where: { id: data.propietario_id },
        });
        if (!existing)
          throw { status: 404, message: "Propietario no encontrado" };
        propietarioId = existing.id;
      } else {
        if (!data.propietario) {
          throw { status: 400, message: "Se requieren datos del propietario" };
        }
        // Delega toda la lógica de creación de usuario al servicio responsable
        const propietario = await this.usuariosService.findOrCreateCliente(
          data.propietario,
        );
        propietarioId = propietario.id;
      }

      const { alergias, ...mascotaData } = data.mascota;

      return await this.prisma.mascota.create({
        data: {
          ...mascotaData,
          peso_actual: mascotaData.peso_actual ?? undefined,
          fecha_nacimiento: mascotaData.fecha_nacimiento
            ? new Date(mascotaData.fecha_nacimiento)
            : undefined,
          propietario_id: propietarioId,
          alergias: alergias?.length
            ? {
                create: alergias.map((a) => ({
                  alergia_id: a.alergia_id,
                  severidad: a.severidad,
                })),
              }
            : undefined,
        },
        include: mascotaInclude,
      });
    } catch (err: any) {
      throw {
        status: err?.status || 500,
        message: err?.message || "Error al crear la mascota",
      };
    }
  }

  async updateMascota(id: string, data: UpdateMascotaDto) {
    try {
      return await this.prisma.mascota.update({
        where: { id },
        data: {
          nombre: data.nombre,
          especie_id: data.especie_id,
          raza_id: data.raza_id,
          color_id: data.color_id,
          sexo: data.sexo,
          esterilizado: data.esterilizado,
          peso_actual:
            data.peso_actual != null ? Number(data.peso_actual) : undefined,
          fecha_nacimiento: data.fecha_nacimiento
            ? new Date(data.fecha_nacimiento)
            : undefined,
        },
        include: mascotaInclude,
      });
    } catch (err) {
      throw { status: 500, message: "Error al actualizar la mascota" };
    }
  }

  async deleteMascota(id: string) {
    try {
      return await this.prisma.mascota.delete({ where: { id } });
    } catch (err) {
      throw { status: 500, message: "Error al eliminar la mascota" };
    }
  }
}
