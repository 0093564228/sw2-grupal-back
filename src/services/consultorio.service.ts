import { PrismaClient } from "@prisma/client";

const consultorioInclude = {
  responsable: {
    select: { id: true, nombre: true, rol: { select: { nombre: true } } },
  },
};

export class ConsultorioService {
  constructor(private readonly prisma: PrismaClient) {}

  async getConsultorios() {
    try {
      return await this.prisma.consultorio.findMany({
        include: consultorioInclude,
        orderBy: { nombre: "asc" },
      });
    } catch (err) {
      throw { status: 500, message: "Error al obtener los consultorios" };
    }
  }

  async getConsultorioById(id: string) {
    try {
      return await this.prisma.consultorio.findUnique({
        where: { id },
        include: consultorioInclude,
      });
    } catch (err) {
      throw { status: 500, message: "Error al obtener el consultorio" };
    }
  }

  async createConsultorio(data: {
    nombre: string;
    especialidad?: string;
    tipo?: "CONSULTORIO" | "LABORATORIO" | "QUIROFANO" | "SALA_ESPERA" | "OTRO";
    responsable_id?: string;
  }) {
    try {
      return await this.prisma.consultorio.create({
        data: {
          ...data,
          tipo: data.tipo || "CONSULTORIO",
        },
        include: consultorioInclude,
      });
    } catch (err) {
      throw { status: 500, message: "Error al crear el consultorio" };
    }
  }

  async updateConsultorio(
    id: string,
    data: {
      nombre?: string;
      especialidad?: string;
      tipo?:
        | "CONSULTORIO"
        | "LABORATORIO"
        | "QUIROFANO"
        | "SALA_ESPERA"
        | "OTRO";
      estado?: "LIBRE" | "OCUPADO" | "LIMPIEZA";
      responsable_id?: string | null;
    },
  ) {
    try {
      return await this.prisma.consultorio.update({
        where: { id },
        data,
        include: consultorioInclude,
      });
    } catch (err) {
      throw { status: 500, message: "Error al actualizar el consultorio" };
    }
  }

  async updateEstado(id: string, estado: "LIBRE" | "OCUPADO" | "LIMPIEZA") {
    try {
      return await this.prisma.consultorio.update({
        where: { id },
        data: { estado },
        include: consultorioInclude,
      });
    } catch (err) {
      throw {
        status: 500,
        message: "Error al actualizar el estado del consultorio",
      };
    }
  }

  async deleteConsultorio(id: string) {
    try {
      return await this.prisma.consultorio.delete({ where: { id } });
    } catch (err) {
      throw { status: 500, message: "Error al eliminar el consultorio" };
    }
  }
}
