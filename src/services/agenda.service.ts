import { PrismaClient } from "@prisma/client";
import { FichaService } from "./ficha.service";
import { CreateCitaDto, UpdateCitaDto, EstadoCita } from "../types";

const citaInclude = {
  mascota: {
    include: {
      propietario: { select: { id: true, nombre: true, telefono: true } },
    },
  },
  doctor: { select: { id: true, nombre: true } },
  consultorio: { select: { id: true, nombre: true, tipo: true } },
};

export class AgendaService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly fichaService: FichaService,
  ) {}

  async getCitas(fecha?: string, doctor_id?: string) {
    try {
      const where: { fecha_hora?: object; doctor_id?: string } = {};
      if (fecha) {
        const start = new Date(fecha);
        start.setHours(0, 0, 0, 0);
        const end = new Date(fecha);
        end.setHours(23, 59, 59, 999);
        where.fecha_hora = { gte: start, lte: end };
      }
      if (doctor_id) where.doctor_id = doctor_id;

      return await this.prisma.cita.findMany({
        where,
        include: citaInclude,
        orderBy: { fecha_hora: "asc" },
      });
    } catch (err) {
      throw { status: 500, message: "Error al obtener las citas" };
    }
  }

  async createCita(data: CreateCitaDto) {
    try {
      return await this.prisma.cita.create({
        data: { ...data, fecha_hora: new Date(data.fecha_hora) },
        include: citaInclude,
      });
    } catch (err) {
      throw { status: 500, message: "Error al crear la cita" };
    }
  }

  async updateCita(id: string, data: UpdateCitaDto) {
    try {
      const { fecha_hora, ...rest } = data;
      const updateData: Record<string, unknown> = { ...rest };
      if (fecha_hora) updateData.fecha_hora = new Date(fecha_hora);
      return await this.prisma.cita.update({
        where: { id },
        data: updateData,
        include: citaInclude,
      });
    } catch (err) {
      throw { status: 500, message: "Error al actualizar la cita" };
    }
  }

  async updateEstadoCita(id: string, estado: EstadoCita) {
    try {
      return await this.prisma.cita.update({
        where: { id },
        data: { estado },
        include: citaInclude,
      });
    } catch (err) {
      throw {
        status: 500,
        message: "Error al actualizar el estado de la cita",
      };
    }
  }

  async deleteCita(id: string) {
    try {
      return await this.prisma.cita.delete({ where: { id } });
    } catch (err) {
      throw { status: 500, message: "Error al eliminar la cita" };
    }
  }

  /**
   * Convierte una cita agendada en una ficha de atención activa (check-in).
   * Delega la creación de la ficha a fichaService.createFicha() — única fuente
   * de verdad para la generación de códigos de turno y creación de fichas.
   */
  async checkInCita(cita_id: string, creado_por_id?: string) {
    try {
      const cita = await this.prisma.cita.findUniqueOrThrow({
        where: { id: cita_id },
      });

      // Buscar servicio genérico "Consulta" o el primero disponible
      const servicio =
        (await this.prisma.catalogoServicio.findFirst({
          where: { nombre: { contains: "Consulta", mode: "insensitive" } },
        })) ?? (await this.prisma.catalogoServicio.findFirst());

      if (!servicio)
        throw {
          status: 500,
          message: "No hay servicios configurados en el catálogo",
        };

      // Delega a fichaService — NO duplica la lógica de generación de turno.
      // Se hace en dos pasos secuenciales: fichaService no devuelve PrismaPromise
      // por lo que no puede mezclarse en $transaction array.
      const ficha = await this.fichaService.createFicha({
        mascota_id: cita.mascota_id,
        servicio_id: servicio.id,
        doctor_id: cita.doctor_id ?? undefined,
        consultorio_id: cita.consultorio_id ?? undefined,
        motivo: cita.motivo,
        creado_por_id,
      } as any);

      await this.prisma.cita.update({
        where: { id: cita_id },
        data: { estado: "CONFIRMADA" },
      });

      return ficha;
    } catch (err: any) {
      throw {
        status: err?.status || 500,
        message: err?.message || "Error en el check-in de la cita",
      };
    }
  }
}
