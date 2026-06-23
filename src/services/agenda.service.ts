import { PrismaClient } from "@prisma/client";
import { FichaService } from "./ficha.service";
import { MailService } from "./mail.service";
import {
  CreateCitaDto,
  UpdateCitaDto,
  SolicitarCitaDto,
  EstadoCita,
  TipoCita,
} from "../types";

const citaInclude = {
  mascota: {
    include: {
      especie: { select: { nombre: true } },
      propietario: {
        select: { id: true, nombre: true, telefono: true, email: true },
      },
    },
  },
  doctor: { select: { id: true, nombre: true } },
  consultorio: { select: { id: true, nombre: true, tipo: true } },
};

export class AgendaService {
  // Horario de atención del hospital (configurable a futuro).
  private static readonly HORA_INICIO = 8;
  private static readonly HORA_FIN = 20;
  // Tolerancia (min) tras la hora de la cita antes de marcar inasistencia.
  private static readonly GRACIA_NO_ASISTIO_MIN = 60;
  // Se envía recordatorio si la cita es dentro de estas horas.
  private static readonly RECORDATORIO_HORAS_ANTES = 24;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly fichaService: FichaService,
    private readonly mailService: MailService,
  ) {}

  /**
   * Marca como NO_ASISTIO las citas PROGRAMADA cuya hora ya pasó (con tolerancia)
   * y que nunca hicieron check-in. Se ejecuta al consultar la agenda: no requiere
   * un proceso/cron en segundo plano. Errores no bloquean la lectura.
   */
  private async marcarInasistencias() {
    try {
      const limite = new Date(
        Date.now() - AgendaService.GRACIA_NO_ASISTIO_MIN * 60000,
      );
      await this.prisma.cita.updateMany({
        where: { estado: "PROGRAMADA", fecha_hora: { lt: limite } },
        data: { estado: "NO_ASISTIO" },
      });
    } catch {
      // No interrumpir la carga de la agenda por una falla al marcar inasistencias.
    }
  }

  /**
   * Envía un recordatorio por correo de las citas próximas (dentro de las
   * próximas N horas) que aún no fueron recordadas. Lazy: corre al consultar la
   * agenda; no requiere cron. Marca recordatorio_enviado para no duplicar.
   */
  private async enviarRecordatorios() {
    try {
      const ahora = new Date();
      const limite = new Date(
        Date.now() + AgendaService.RECORDATORIO_HORAS_ANTES * 3600 * 1000,
      );
      const proximas = await this.prisma.cita.findMany({
        where: {
          estado: { in: ["PROGRAMADA", "CONFIRMADA"] },
          recordatorio_enviado: false,
          fecha_hora: { gte: ahora, lte: limite },
        },
        include: citaInclude,
      });
      for (const cita of proximas) {
        // Marcamos primero para no duplicar ante cargas concurrentes.
        await this.prisma.cita.update({
          where: { id: cita.id },
          data: { recordatorio_enviado: true },
        });
        void this.mailService.enviarRecordatorioCita(cita);
      }
    } catch {
      // No interrumpir la carga de la agenda por una falla de recordatorios.
    }
  }

  async getCitas(
    fecha?: string,
    doctor_id?: string,
    desde?: string,
    hasta?: string,
  ) {
    try {
      await this.marcarInasistencias();
      await this.enviarRecordatorios();
      const where: { fecha_hora?: object; doctor_id?: string } = {};
      // Parseamos como medianoche LOCAL ("...T00:00:00"); con new Date("YYYY-MM-DD")
      // JS asume UTC y la ventana del día queda corrida por la zona horaria.
      if (desde && hasta) {
        const start = new Date(`${desde}T00:00:00`);
        const end = new Date(`${hasta}T23:59:59.999`);
        where.fecha_hora = { gte: start, lte: end };
      } else if (fecha) {
        const start = new Date(`${fecha}T00:00:00`);
        const end = new Date(`${fecha}T23:59:59.999`);
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
      const fechaHora = new Date(data.fecha_hora);
      const duracion = data.duracion_min ?? 30;
      this.validarHorario(fechaHora, duracion);
      await this.validarDisponibilidad(fechaHora, duracion, {
        doctor_id: data.doctor_id,
        consultorio_id: data.consultorio_id,
      });

      const cita = await this.prisma.cita.create({
        data: {
          mascota_id: data.mascota_id,
          doctor_id: data.doctor_id || null,
          consultorio_id: data.consultorio_id || null,
          fecha_hora: fechaHora,
          duracion_min: duracion,
          tipo: data.tipo,
          motivo: data.motivo,
          notas: data.notas,
        },
        include: citaInclude,
      });
      // Confirmación al propietario (no bloquea la respuesta).
      void this.mailService.enviarConfirmacionCita(cita);
      return cita;
    } catch (err: any) {
      throw {
        status: err?.status || 500,
        message: err?.message || "Error al crear la cita",
      };
    }
  }

  async updateCita(id: string, data: UpdateCitaDto) {
    try {
      const existing = await this.prisma.cita.findUniqueOrThrow({
        where: { id },
      });

      const fechaHora = data.fecha_hora
        ? new Date(data.fecha_hora)
        : existing.fecha_hora;
      const duracion = data.duracion_min ?? existing.duracion_min;
      const doctor_id =
        data.doctor_id !== undefined ? data.doctor_id : existing.doctor_id;
      const consultorio_id =
        data.consultorio_id !== undefined
          ? data.consultorio_id
          : existing.consultorio_id;

      const cambiaProgramacion =
        data.fecha_hora !== undefined ||
        data.doctor_id !== undefined ||
        data.consultorio_id !== undefined ||
        data.duracion_min !== undefined;

      if (cambiaProgramacion) {
        if (data.fecha_hora !== undefined) {
          this.validarHorario(fechaHora, duracion);
        }
        await this.validarDisponibilidad(fechaHora, duracion, {
          doctor_id: doctor_id ?? undefined,
          consultorio_id: consultorio_id ?? undefined,
          excludeId: id,
        });
      }

      const { fecha_hora, ...rest } = data;
      const updateData: Record<string, unknown> = { ...rest };
      if (fecha_hora) updateData.fecha_hora = fechaHora;

      return await this.prisma.cita.update({
        where: { id },
        data: updateData,
        include: citaInclude,
      });
    } catch (err: any) {
      throw {
        status: err?.status || 500,
        message: err?.message || "Error al actualizar la cita",
      };
    }
  }

  async updateEstadoCita(id: string, estado: EstadoCita) {
    try {
      const cita = await this.prisma.cita.update({
        where: { id },
        data: { estado },
        include: citaInclude,
      });
      // Al programar/confirmar (incluye aceptar una solicitud) avisamos por correo.
      if (estado === "PROGRAMADA") {
        void this.mailService.enviarConfirmacionCita(cita);
      }
      return cita;
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

  /** Todas las solicitudes pendientes (SOLICITADA), sin importar la fecha. */
  async getSolicitudesPendientes() {
    try {
      return await this.prisma.cita.findMany({
        where: { estado: "SOLICITADA" },
        include: citaInclude,
        orderBy: { fecha_hora: "asc" },
      });
    } catch (err) {
      throw { status: 500, message: "Error al obtener las solicitudes" };
    }
  }

  // ── Autoservicio del propietario (rol CLIENTE) ────────────────────────────

  /**
   * El propietario SOLICITA una cita para una de SUS mascotas.
   * Se crea en estado SOLICITADA (sin doctor) para que recepción la confirme
   * y asigne médico/consultorio. Valida propiedad de la mascota y horario.
   */
  async solicitarCitaPropietario(propietarioId: string, data: SolicitarCitaDto) {
    try {
      const mascota = await this.prisma.mascota.findUnique({
        where: { id: data.mascota_id },
      });
      if (!mascota || mascota.propietario_id !== propietarioId) {
        throw {
          status: 403,
          message: "Solo puedes agendar citas para tus propias mascotas",
        };
      }

      const fechaHora = new Date(data.fecha_hora);
      const duracion = data.duracion_min ?? 30;
      this.validarHorario(fechaHora, duracion);

      // Autoservicio limitado a tipos básicos (no cirugías por esta vía).
      const permitidos = ["CONSULTA", "CONTROL", "VACUNACION"];
      const tipo = (
        permitidos.includes(data.tipo ?? "") ? data.tipo : "CONSULTA"
      ) as TipoCita;

      return await this.prisma.cita.create({
        data: {
          mascota_id: data.mascota_id,
          fecha_hora: fechaHora,
          duracion_min: duracion,
          tipo,
          motivo: data.motivo?.trim() || "Solicitud de cita en línea",
          estado: "SOLICITADA",
        },
        include: citaInclude,
      });
    } catch (err: any) {
      throw {
        status: err?.status || 500,
        message: err?.message || "Error al solicitar la cita",
      };
    }
  }

  async getCitasPropietario(propietarioId: string) {
    try {
      await this.marcarInasistencias();
      return await this.prisma.cita.findMany({
        where: { mascota: { propietario_id: propietarioId } },
        include: citaInclude,
        orderBy: { fecha_hora: "desc" },
      });
    } catch (err) {
      throw { status: 500, message: "Error al obtener tus citas" };
    }
  }

  async getMascotasPropietario(propietarioId: string) {
    try {
      return await this.prisma.mascota.findMany({
        where: { propietario_id: propietarioId },
        select: {
          id: true,
          nombre: true,
          especie: { select: { nombre: true } },
        },
        orderBy: { nombre: "asc" },
      });
    } catch (err) {
      throw { status: 500, message: "Error al obtener tus mascotas" };
    }
  }

  /**
   * Calcula los horarios (slots de 30 min) de un día y marca cuáles están libres.
   * - Con doctor_id: disponibilidad de ESE veterinario (libre = sin solapamiento).
   * - Sin doctor_id: disponibilidad general (libre = citas solapadas < nº de veterinarios).
   * Los slots pasados (hoy) se marcan ocupados.
   */
  async getDisponibilidad(
    fecha: string,
    doctorId?: string,
    duracionMin = 30,
  ): Promise<Array<{ hora: string; libre: boolean }>> {
    try {
      const base = new Date(`${fecha}T00:00:00`);
      if (isNaN(base.getTime())) {
        throw { status: 400, message: "Fecha no válida" };
      }

      const dayStart = new Date(base);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(base);
      dayEnd.setHours(23, 59, 59, 999);

      const citas = await this.prisma.cita.findMany({
        where: {
          fecha_hora: { gte: dayStart, lte: dayEnd },
          estado: { in: ["PROGRAMADA", "CONFIRMADA"] },
          ...(doctorId ? { doctor_id: doctorId } : { doctor_id: { not: null } }),
        },
        select: { fecha_hora: true, duracion_min: true },
      });

      let capacidad = 1;
      if (!doctorId) {
        capacidad = await this.prisma.usuario.count({
          where: { activo: true, rol: { nombre: "VETERINARIO" } },
        });
        if (capacidad < 1) capacidad = 1;
      }

      const ahora = Date.now();
      const stepMin = 30;
      const slots: Array<{ hora: string; libre: boolean }> = [];

      for (
        let m = AgendaService.HORA_INICIO * 60;
        m + duracionMin <= AgendaService.HORA_FIN * 60;
        m += stepMin
      ) {
        const slotStart = new Date(base);
        slotStart.setHours(0, m, 0, 0);
        const sIni = slotStart.getTime();
        const sFin = sIni + duracionMin * 60000;

        let libre = sIni >= ahora;
        if (libre) {
          let solapadas = 0;
          for (const c of citas) {
            const cIni = c.fecha_hora.getTime();
            const cFin = cIni + (c.duracion_min ?? 30) * 60000;
            if (cIni < sFin && cFin > sIni) solapadas++;
          }
          libre = doctorId ? solapadas === 0 : solapadas < capacidad;
        }

        const hh = String(Math.floor(m / 60)).padStart(2, "0");
        const mm = String(m % 60).padStart(2, "0");
        slots.push({ hora: `${hh}:${mm}`, libre });
      }

      return slots;
    } catch (err: any) {
      throw {
        status: err?.status || 500,
        message: err?.message || "Error al obtener la disponibilidad",
      };
    }
  }

  // ── Validaciones ──────────────────────────────────────────────────────────

  /** Verifica que la cita no sea en el pasado y caiga dentro del horario. */
  private validarHorario(fechaHora: Date, duracionMin: number) {
    if (isNaN(fechaHora.getTime())) {
      throw { status: 400, message: "Fecha u hora no válida" };
    }
    if (fechaHora.getTime() < Date.now()) {
      throw {
        status: 400,
        message: "No se puede agendar en una fecha u hora pasada",
      };
    }
    const inicioH = fechaHora.getHours() + fechaHora.getMinutes() / 60;
    const finH = inicioH + duracionMin / 60;
    if (inicioH < AgendaService.HORA_INICIO || finH > AgendaService.HORA_FIN) {
      throw {
        status: 400,
        message: `El horario de atención es de ${AgendaService.HORA_INICIO}:00 a ${AgendaService.HORA_FIN}:00`,
      };
    }
  }

  /** Rechaza solapamientos de un mismo veterinario o consultorio. */
  private async validarDisponibilidad(
    fechaHora: Date,
    duracionMin: number,
    opts: {
      doctor_id?: string | null;
      consultorio_id?: string | null;
      excludeId?: string;
    },
  ) {
    const recursos: Array<{ doctor_id?: string; consultorio_id?: string }> = [];
    if (opts.doctor_id) recursos.push({ doctor_id: opts.doctor_id });
    if (opts.consultorio_id)
      recursos.push({ consultorio_id: opts.consultorio_id });
    if (recursos.length === 0) return;

    const inicio = fechaHora.getTime();
    const fin = inicio + duracionMin * 60000;

    const dayStart = new Date(fechaHora);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(fechaHora);
    dayEnd.setHours(23, 59, 59, 999);

    const citas = await this.prisma.cita.findMany({
      where: {
        ...(opts.excludeId ? { id: { not: opts.excludeId } } : {}),
        fecha_hora: { gte: dayStart, lte: dayEnd },
        estado: { in: ["PROGRAMADA", "CONFIRMADA"] },
        OR: recursos,
      },
    });

    for (const c of citas) {
      const cInicio = c.fecha_hora.getTime();
      const cFin = cInicio + (c.duracion_min ?? 30) * 60000;
      const seSolapan = cInicio < fin && cFin > inicio;
      if (!seSolapan) continue;
      if (opts.doctor_id && c.doctor_id === opts.doctor_id) {
        throw {
          status: 409,
          message: "El veterinario ya tiene una cita en ese horario",
        };
      }
      if (opts.consultorio_id && c.consultorio_id === opts.consultorio_id) {
        throw {
          status: 409,
          message: "El consultorio ya está ocupado en ese horario",
        };
      }
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
      const ficha = await this.fichaService.createFicha({
        mascota_id: cita.mascota_id,
        servicio_id: servicio.id,
        doctor_id: cita.doctor_id ?? undefined,
        consultorio_id: cita.consultorio_id ?? undefined,
        motivo: cita.motivo,
        creado_por_id,
      } as any);

      // El paciente llegó: la cita queda CONFIRMADA y su atención continúa en la ficha.
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
