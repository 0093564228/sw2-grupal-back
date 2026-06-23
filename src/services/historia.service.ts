import { PrismaClient } from "@prisma/client";

const historiaInclude = {
  mascota: {
    include: {
      especie: true,
      raza: true,
      propietario: {
        select: { id: true, nombre: true, telefono: true, ci: true, email: true },
      },
    },
  },
  atendido_por: { select: { id: true, nombre: true } },
  created_by: { select: { id: true, nombre: true } },
  finalized_by: { select: { id: true, nombre: true } },
  evoluciones: { orderBy: { fecha: "asc" as const } },
};

// Campos que el médico puede escribir. Protege estado/folio/auditoría/relaciones
// de un mass-assignment desde el body.
const CAMPOS_EDITABLES = [
  "propietario_nombre",
  "domicilio",
  "telefono",
  "celular",
  "edad",
  "peso",
  "motivo_consulta",
  "vacunas",
  "vacunas_otras",
  "desparasitacion",
  "desparasitacion_cuando",
  "enfermedades_previas",
  "intervenciones_previas",
  "estado_general",
  "apetito",
  "hidratacion",
  "mucosa",
  "ap_digestivo",
  "ap_genitourinario",
  "ap_respiratorio",
  "temperatura",
  "fc",
  "fr",
  "observacion_clinica",
  "pruebas_complementarias",
  "diagnostico_presuntivo",
  "diagnostico_confirmativo",
  "pronostico",
  "tratamiento",
];

function pickCampos(data: any) {
  const out: Record<string, any> = {};
  for (const k of CAMPOS_EDITABLES) {
    if (data[k] !== undefined) out[k] = data[k];
  }
  return out;
}

export class HistoriaService {
  constructor(private readonly prisma: PrismaClient) {}

  async getByMascota(mascota_id: string) {
    try {
      return await this.prisma.historiaClinica.findMany({
        where: { mascota_id },
        orderBy: { fecha: "desc" },
        select: {
          id: true,
          folio: true,
          fecha: true,
          motivo_consulta: true,
          diagnostico_presuntivo: true,
          diagnostico_confirmativo: true,
          estado: true,
          atendido_por: { select: { nombre: true } },
        },
      });
    } catch (err) {
      throw { status: 500, message: "Error al obtener las historias clínicas" };
    }
  }

  async getByFicha(ficha_id: string) {
    try {
      return await this.prisma.historiaClinica.findUnique({
        where: { ficha_id },
        include: historiaInclude,
      });
    } catch (err) {
      throw { status: 500, message: "Error al obtener la historia de la ficha" };
    }
  }

  async getById(id: string) {
    try {
      return await this.prisma.historiaClinica.findUnique({
        where: { id },
        include: historiaInclude,
      });
    } catch (err) {
      throw { status: 500, message: "Error al obtener la historia clínica" };
    }
  }

  async create(data: any, userId: string) {
    try {
      if (!data.mascota_id) {
        throw { status: 400, message: "mascota_id es obligatorio" };
      }
      const campos = pickCampos(data);
      const evoluciones = Array.isArray(data.evoluciones)
        ? data.evoluciones
        : [];
      return await this.prisma.historiaClinica.create({
        data: {
          mascota_id: data.mascota_id,
          ficha_id: data.ficha_id ?? null,
          created_by_id: userId,
          atendido_por_id: data.atendido_por_id ?? userId,
          ...campos,
          ...(evoluciones.length
            ? {
                evoluciones: {
                  create: evoluciones
                    .filter((e: any) => e?.descripcion?.trim())
                    .map((e: any) => ({
                      descripcion: e.descripcion,
                      ...(e.fecha ? { fecha: new Date(e.fecha) } : {}),
                    })),
                },
              }
            : {}),
        },
        include: historiaInclude,
      });
    } catch (err: any) {
      if (err?.code === "P2002") {
        throw {
          status: 409,
          message: "Esta ficha de atención ya tiene una historia clínica",
        };
      }
      throw {
        status: err?.status || 500,
        message: err?.message || "Error al crear la historia clínica",
      };
    }
  }

  async update(id: string, data: any) {
    try {
      const actual = await this.prisma.historiaClinica.findUniqueOrThrow({
        where: { id },
        select: { estado: true },
      });
      if (actual.estado === "FINALIZADA") {
        throw {
          status: 403,
          message:
            "La historia clínica está finalizada y no puede modificarse.",
        };
      }
      const campos = pickCampos(data);
      return await this.prisma.$transaction(async (tx) => {
        if (Array.isArray(data.evoluciones)) {
          await tx.evolucionTratamiento.deleteMany({
            where: { historia_id: id },
          });
          const limpias = data.evoluciones.filter((e: any) =>
            e?.descripcion?.trim(),
          );
          if (limpias.length) {
            await tx.evolucionTratamiento.createMany({
              data: limpias.map((e: any) => ({
                historia_id: id,
                descripcion: e.descripcion,
                ...(e.fecha ? { fecha: new Date(e.fecha) } : {}),
              })),
            });
          }
        }
        return tx.historiaClinica.update({
          where: { id },
          data: {
            ...campos,
            ...(data.atendido_por_id !== undefined && {
              atendido_por_id: data.atendido_por_id,
            }),
          },
          include: historiaInclude,
        });
      });
    } catch (err: any) {
      throw {
        status: err?.status || 500,
        message: err?.message || "Error al actualizar la historia clínica",
      };
    }
  }

  async finalizar(id: string, userId: string) {
    try {
      const actual = await this.prisma.historiaClinica.findUniqueOrThrow({
        where: { id },
        select: { estado: true },
      });
      if (actual.estado === "FINALIZADA") {
        throw { status: 403, message: "La historia clínica ya está finalizada" };
      }
      return await this.prisma.historiaClinica.update({
        where: { id },
        data: {
          estado: "FINALIZADA",
          finalized_by_id: userId,
          finalized_at: new Date(),
        },
        include: historiaInclude,
      });
    } catch (err: any) {
      throw {
        status: err?.status || 500,
        message: err?.message || "Error al finalizar la historia clínica",
      };
    }
  }

  async remove(id: string) {
    try {
      const actual = await this.prisma.historiaClinica.findUniqueOrThrow({
        where: { id },
        select: { estado: true },
      });
      if (actual.estado === "FINALIZADA") {
        throw {
          status: 403,
          message: "No se puede eliminar una historia clínica finalizada.",
        };
      }
      return await this.prisma.historiaClinica.delete({ where: { id } });
    } catch (err: any) {
      throw {
        status: err?.status || 500,
        message: err?.message || "Error al eliminar la historia clínica",
      };
    }
  }
}
