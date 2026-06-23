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
  soap: true,
  consumos: { include: { producto: true } },
  servicios_realizados: { include: { servicio: true } },
  recibo: true,
};

export class FichaService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Genera un código de turno corto estilo banco (Ej: C-01, E-05)
   * Se reinicia cada día.
   */
  /**
   * Genera un código de turno corto por tipo (C=consulta, L=laboratorio,
   * E=emergencia, T=otro). Numeración CONTINUA por prefijo: como `cod_ficha`
   * es único a nivel global, se toma el mayor número existente del prefijo y se
   * suma 1 (no se reinicia por día, lo que provocaba colisiones al cambiar de
   * fecha).
   */
  private async genCodTurno(prioridad: string, servicioId: string) {
    let prefix = "T";

    if (prioridad === "URGENTE") {
      prefix = "E";
    } else {
      const servicio = await this.prisma.catalogoServicio.findUnique({
        where: { id: servicioId },
      });
      const nombre = servicio?.nombre.toLowerCase() || "";
      if (nombre.includes("laboratorio")) prefix = "L";
      else if (nombre.includes("consulta")) prefix = "C";
    }

    const fichas = await this.prisma.fichaAtencion.findMany({
      where: { cod_ficha: { startsWith: `${prefix}-` } },
      select: { cod_ficha: true },
    });

    let max = 0;
    for (const f of fichas) {
      const n = parseInt(f.cod_ficha.replace(`${prefix}-`, ""), 10);
      if (!Number.isNaN(n) && n > max) max = n;
    }
    return `${prefix}-${String(max + 1).padStart(2, "0")}`;
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
    // Reintenta si dos turnos se generan a la vez y chocan en cod_ficha (único).
    for (let intento = 0; intento < 5; intento++) {
      try {
        const cod_ficha = await this.genCodTurno(
          data.prioridad || "NORMAL",
          data.servicio_id,
        );
        return await this.prisma.fichaAtencion.create({
          data: { ...data, cod_ficha },
          include: fichaInclude,
        });
      } catch (err: any) {
        // P2002 = colisión de cod_ficha → recalcular y reintentar
        if (err?.code === "P2002") continue;
        throw {
          status: err?.status || 500,
          message: err?.message || "Error al crear la ficha de atención",
        };
      }
    }
    throw {
      status: 500,
      message:
        "No se pudo generar un número de turno único. Intente nuevamente.",
    };
  }

  async iniciarFicha(
    id: string,
    data: { doctor_id?: string; consultorio_id: string },
    actorId: string,
  ) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        // Ocupa la sala de forma atómica: solo si SIGUE libre.
        // Si otra atención la tomó primero, count = 0 y abortamos (evita doble-asignación).
        const ocupada = await tx.consultorio.updateMany({
          where: { id: data.consultorio_id, estado: "LIBRE" },
          data: { estado: "OCUPADO" },
        });
        if (ocupada.count === 0) {
          throw {
            status: 409,
            message:
              "La sala seleccionada ya no está disponible. Elige otra sala libre.",
          };
        }
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
    } catch (err: any) {
      throw {
        status: err?.status || 500,
        message: err?.message || "Error al iniciar la ficha de atención",
      };
    }
  }

  async completarFicha(id: string) {
    try {
      // La sala NO se libera aquí: queda OCUPADA hasta que el cajero registre el
      // pago. La liberación del consultorio es automática en CajaService.cobrarFicha.
      return await this.prisma.fichaAtencion.update({
        where: { id },
        data: { estado: "COMPLETADA" },
        include: fichaInclude,
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

  // ── SERVICIOS REALIZADOS EN LA CONSULTA ─────────────────────────────
  async getServiciosRealizados(ficha_id: string) {
    try {
      return await this.prisma.fichaServicio.findMany({
        where: { ficha_id },
        include: { servicio: true },
        orderBy: { created_at: "asc" },
      });
    } catch (err) {
      throw {
        status: 500,
        message: "Error al obtener los servicios de la ficha",
      };
    }
  }

  async addServicioRealizado(
    ficha_id: string,
    data: { servicio_id: string; cantidad?: number },
  ) {
    try {
      // El precio se "congela" desde el catálogo al momento de agregarlo.
      const servicio = await this.prisma.catalogoServicio.findUniqueOrThrow({
        where: { id: data.servicio_id },
      });
      return await this.prisma.fichaServicio.create({
        data: {
          ficha_id,
          servicio_id: data.servicio_id,
          precio: servicio.precio_base,
          cantidad: data.cantidad && data.cantidad > 0 ? data.cantidad : 1,
        },
        include: { servicio: true },
      });
    } catch (err: any) {
      throw {
        status: err?.status || 500,
        message: err?.message || "Error al agregar el servicio a la consulta",
      };
    }
  }

  async removeServicioRealizado(id: string) {
    try {
      return await this.prisma.fichaServicio.delete({ where: { id } });
    } catch (err) {
      throw { status: 500, message: "Error al eliminar el servicio" };
    }
  }
}
