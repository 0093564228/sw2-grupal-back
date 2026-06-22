import { PrismaClient } from "@prisma/client";

const fichaInclude = {
  mascota: {
    include: {
      especie: true,
      raza: true,
      propietario: {
        select: {
          id: true,
          nombre: true,
          email: true,
          telefono: true,
          ci: true,
        },
      },
      alergias: { include: { alergia: true } },
    },
  },
  servicio: true,
  doctor: { select: { id: true, nombre: true, email: true } },
  consultorio: true,
  creado_por: { select: { id: true, nombre: true } },
  soap: {
    include: {
      receta: { include: { detalles: { include: { producto: true } } } },
    },
  },
  ordenes_lab: { include: { examen: true, resultado: true } },
  consumos: { include: { producto: true } },
  recibo: true,
};

export class FichaService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Genera un código de turno corto estilo banco (Ej: C-01, E-05)
   * Se reinicia cada día.
   */
  private async genTurnoDiario(prioridad: string, servicioId: string) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // 1. Determinar el prefijo
    let prefix = "T"; // Default: Turno

    if (prioridad === "URGENTE") {
      prefix = "E"; // Emergencia
    } else {
      const servicio = await this.prisma.catalogoServicio.findUnique({
        where: { id: servicioId },
      });
      const nombre = servicio?.nombre.toLowerCase() || "";
      if (nombre.includes("laboratorio")) prefix = "L";
      else if (nombre.includes("consulta")) prefix = "C";
    }

    // 2. Buscar el mayor número ya asignado hoy para ese prefijo
    const last = await this.prisma.fichaAtencion.findFirst({
      where: {
        cod_ficha: { startsWith: `${prefix}-` },
        fecha_hora: { gte: startOfDay, lte: endOfDay },
      },
      orderBy: { fecha_hora: "desc" },
      select: { cod_ficha: true },
    });

    const lastNum = last
      ? parseInt(last.cod_ficha.replace(`${prefix}-`, ""), 10) || 0
      : 0;
    return `${prefix}-${String(lastNum + 1).padStart(2, "0")}`;
  }

  async getFichas(filters?: {
    estado?: string;
    doctor_id?: string;
    fecha?: string;
  }) {
    try {
      const where: any = {};
      if (filters?.estado) where.estado = filters.estado;
      if (filters?.doctor_id) where.doctor_id = filters.doctor_id;
      if (filters?.fecha) {
        const d = new Date(filters.fecha);
        const next = new Date(d);
        next.setDate(d.getDate() + 1);
        where.fecha_hora = { gte: d, lt: next };
      }
      return await this.prisma.fichaAtencion.findMany({
        where,
        include: fichaInclude,
        orderBy: { fecha_hora: "desc" },
      });
    } catch (err) {
      throw { status: 500, message: "Error al obtener las fichas de atención" };
    }
  }

  async getFichaById(id: string) {
    try {
      return await this.prisma.fichaAtencion.findUnique({
        where: { id },
        include: fichaInclude,
      });
    } catch (err) {
      throw { status: 500, message: "Error al obtener la ficha de atención" };
    }
  }

  async createFicha(data: {
    mascota_id: string;
    servicio_id: string;
    motivo?: string;
    prioridad?: "URGENTE" | "NORMAL";
    creado_por_id?: string;
  }) {
    try {
      // GENERACIÓN DEL TURNO CORTO ESTILO BANCO
      const cod_ficha = await this.genTurnoDiario(
        data.prioridad || "NORMAL",
        data.servicio_id,
      );

      return await this.prisma.fichaAtencion.create({
        data: { ...data, cod_ficha },
        include: fichaInclude,
      });
    } catch (err: any) {
      throw {
        status: err?.status || 500,
        message: err?.message || "Error al crear la ficha de atención",
      };
    }
  }

  async iniciarFicha(
    id: string,
    data: { doctor_id?: string; consultorio_id: string },
    actorId: string,
  ) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        await tx.consultorio.update({
          where: { id: data.consultorio_id },
          data: { estado: "OCUPADO" },
        });
        return tx.fichaAtencion.update({
          where: { id },
          // asignación deliberada (body) si viene; si no, el actor que inicia la atención
          data: {
            doctor_id: data.doctor_id ?? actorId,
            consultorio_id: data.consultorio_id,
            estado: "EN_CURSO",
          },
          include: fichaInclude,
        });
      });
    } catch (err) {
      throw { status: 500, message: "Error al iniciar la ficha de atención" };
    }
  }

  async completarFicha(id: string) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const ficha = await tx.fichaAtencion.findUnique({
          where: { id },
          select: { consultorio_id: true },
        });
        if (ficha?.consultorio_id) {
          await tx.consultorio.update({
            where: { id: ficha.consultorio_id },
            data: { estado: "LIBRE" },
          });
        }
        return tx.fichaAtencion.update({
          where: { id },
          data: { estado: "COMPLETADA" },
          include: fichaInclude,
        });
      });
    } catch (err) {
      throw { status: 500, message: "Error al completar la ficha de atención" };
    }
  }

  async cancelarFicha(id: string) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const ficha = await tx.fichaAtencion.findUnique({
          where: { id },
          select: { consultorio_id: true },
        });
        if (ficha?.consultorio_id) {
          await tx.consultorio.update({
            where: { id: ficha.consultorio_id },
            data: { estado: "LIBRE" },
          });
        }
        return tx.fichaAtencion.update({
          where: { id },
          data: { estado: "CANCELADA" },
          include: fichaInclude,
        });
      });
    } catch (err) {
      throw { status: 500, message: "Error al cancelar la ficha de atención" };
    }
  }

  async updateFicha(id: string, data: any) {
    try {
      return await this.prisma.fichaAtencion.update({
        where: { id },
        data,
        include: fichaInclude,
      });
    } catch (err) {
      throw {
        status: 500,
        message: "Error al actualizar la ficha de atención",
      };
    }
  }

  // ── RIESGO CLÍNICO ──────────────────────────────────────────────────
  /**
   * Evalúa los signos vitales del SOAP y clasifica el riesgo clínico del paciente.
   * Acumula puntuación por cada signo fuera de rango y por peso extremo.
   * Niveles: BAJO(<2), MEDIO(2-3), ALTO(4-6), CRITICO(>=7).
   */
  calcularRiesgoClinico(signos: {
    peso: number;
    temperatura: number;
    fc: number;
    fr: number;
  }): {
    nivel: "BAJO" | "MEDIO" | "ALTO" | "CRITICO";
    puntuacion: number;
    alertas: string[];
  } {
    const { peso, temperatura, fc, fr } = signos;

    if (peso <= 0 || temperatura <= 0 || fc <= 0 || fr <= 0) {
      throw {
        status: 400,
        message: "Todos los signos vitales deben ser valores positivos",
      };
    }

    const rangos = [
      {
        nombre: "Temperatura",
        valor: temperatura,
        min: 37.5,
        max: 39.2,
        alerta: "Temperatura fuera de rango",
      },
      {
        nombre: "Frec. Cardiaca",
        valor: fc,
        min: 60,
        max: 160,
        alerta: "Frecuencia cardíaca anormal",
      },
      {
        nombre: "Frec. Respiratoria",
        valor: fr,
        min: 15,
        max: 30,
        alerta: "Frecuencia respiratoria anormal",
      },
    ];

    let puntuacion = 0;
    const alertas: string[] = [];
    let i = 0;

    while (i < rangos.length) {
      const r = rangos[i];
      if (r.valor < r.min) {
        puntuacion += 2;
        alertas.push(`${r.alerta} (bajo)`);
      } else if (r.valor > r.max) {
        puntuacion += 2;
        alertas.push(`${r.alerta} (alto)`);
      }
      i++;
    }

    if (peso < 0.5) {
      puntuacion += 3;
      alertas.push("Peso crítico");
    } else if (peso > 80) {
      puntuacion += 1;
      alertas.push("Peso elevado");
    }

    let nivel: "BAJO" | "MEDIO" | "ALTO" | "CRITICO";
    if (puntuacion >= 7) {
      nivel = "CRITICO";
    } else if (puntuacion >= 4) {
      nivel = "ALTO";
    } else if (puntuacion >= 2) {
      nivel = "MEDIO";
    } else {
      nivel = "BAJO";
    }

    return { nivel, puntuacion, alertas };
  }

  // ── SOAP ────────────────────────────────────────────────────────────
  async getSoap(ficha_id: string) {
    try {
      return await this.prisma.registroSOAP.findUnique({
        where: { ficha_id },
        include: {
          receta: { include: { detalles: { include: { producto: true } } } },
        },
      });
    } catch (err) {
      throw { status: 500, message: "Error al obtener el registro SOAP" };
    }
  }

  async upsertSoap(
    ficha_id: string,
    data: {
      motivo_detalle?: string;
      anamnesis?: string;
      peso?: number;
      temperatura?: number;
      fc?: number;
      fr?: number;
      hallazgos?: string;
      diagnostico?: string;
      tratamiento?: string;
    },
  ) {
    try {
      return await this.prisma.registroSOAP.upsert({
        where: { ficha_id },
        create: { ficha_id, ...data },
        update: data,
        include: {
          receta: { include: { detalles: { include: { producto: true } } } },
        },
      });
    } catch (err) {
      throw { status: 500, message: "Error al guardar el registro SOAP" };
    }
  }

  // ── CONSUMOS EN CONSULTA ────────────────────────────────────────────
  async getConsumos(ficha_id: string) {
    try {
      return await this.prisma.consumoConsulta.findMany({
        where: { ficha_id },
        include: { producto: true },
      });
    } catch (err) {
      throw { status: 500, message: "Error al obtener los consumos" };
    }
  }

  async addConsumo(
    ficha_id: string,
    data: { producto_id: string; cantidad: number },
  ) {
    try {
      return await this.prisma.consumoConsulta.create({
        data: { ficha_id, ...data },
        include: { producto: true },
      });
    } catch (err) {
      throw { status: 500, message: "Error al registrar el consumo" };
    }
  }

  async removeConsumo(id: string) {
    try {
      return await this.prisma.consumoConsulta.delete({ where: { id } });
    } catch (err) {
      throw { status: 500, message: "Error al eliminar el consumo" };
    }
  }

  // ── RECETA ──────────────────────────────────────────────────────────
  async createReceta(
    ficha_id: string,
    data: {
      indicaciones?: string;
      detalles: {
        producto_id: string;
        cantidad: number;
        instrucciones?: string;
      }[];
    },
  ) {
    try {
      let soap = await this.prisma.registroSOAP.findUnique({
        where: { ficha_id },
      });
      if (!soap)
        soap = await this.prisma.registroSOAP.create({ data: { ficha_id } });
      return await this.prisma.recetaMedica.create({
        data: {
          soap_id: soap.id,
          indicaciones: data.indicaciones,
          detalles: { create: data.detalles },
        },
        include: { detalles: { include: { producto: true } } },
      });
    } catch (err) {
      throw { status: 500, message: "Error al crear la receta médica" };
    }
  }
}
