import { PrismaClient } from "@prisma/client";

const diaBuckets = () =>
  Array.from({ length: 7 }, (_, i) => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (6 - i));
    const end = new Date(start);
    end.setDate(start.getDate() + 1);
    const label = start.toLocaleDateString("es-ES", {
      weekday: "short",
      day: "numeric",
    });
    return { start, end, label };
  });

export class DashboardService {
  constructor(private readonly prisma: PrismaClient) {}

  async getKpis() {
    try {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const manana = new Date(hoy);
      manana.setDate(hoy.getDate() + 1);

      const buckets = diaBuckets();

      const [
        fichasHoy,
        fichasEspera,
        fichasEnCurso,
        consultorios,
        stockCritico,
        ingresosHoy,
        recibosRecientes,
        totalMascotas,
        semanaDatos,
      ] = await Promise.all([
        this.prisma.fichaAtencion.count({
          where: { fecha_hora: { gte: hoy, lt: manana } },
        }),
        this.prisma.fichaAtencion.count({ where: { estado: "ESPERA" } }),
        this.prisma.fichaAtencion.count({ where: { estado: "EN_CURSO" } }),
        this.prisma.consultorio.findMany({ orderBy: { nombre: "asc" } }),
        this.prisma.producto.findMany({
          where: {
            stock_actual: { lte: this.prisma.producto.fields.stock_minimo },
          },
          select: {
            id: true,
            nombre: true,
            stock_actual: true,
            stock_minimo: true,
          },
        }),
        this.prisma.reciboCaja.aggregate({
          where: { fecha_pago: { gte: hoy, lt: manana }, estado: "PAGADO" },
          _sum: { total: true },
        }),
        this.prisma.reciboCaja.findMany({
          where: { estado: "PAGADO" },
          take: 10,
          orderBy: { fecha_pago: "desc" },
          include: {
            ficha: {
              include: {
                mascota: { select: { nombre: true } },
                servicio: true,
              },
            },
            cajero: { select: { nombre: true } },
          },
        }),
        this.prisma.mascota.count(),
        Promise.all(
          buckets.map(async ({ start, end, label }) => {
            const [ingresos, fichas] = await Promise.all([
              this.prisma.reciboCaja.aggregate({
                where: {
                  fecha_pago: { gte: start, lt: end },
                  estado: "PAGADO",
                },
                _sum: { total: true },
              }),
              this.prisma.fichaAtencion.count({
                where: { fecha_hora: { gte: start, lt: end } },
              }),
            ]);
            return {
              dia: label,
              ingresos: Number(ingresos._sum.total ?? 0),
              fichas,
            };
          }),
        ),
      ]);

      return {
        fichas_hoy: fichasHoy,
        en_espera: fichasEspera,
        en_curso: fichasEnCurso,
        consultorios: consultorios.map((c) => ({
          id: c.id,
          nombre: c.nombre,
          especialidad: c.especialidad,
          estado: c.estado,
        })),
        stock_critico: stockCritico.length,
        productos_criticos: stockCritico,
        ingresos_hoy: Number(ingresosHoy._sum.total ?? 0),
        recibos_recientes: recibosRecientes,
        total_mascotas: totalMascotas,
        semana: semanaDatos,
      };
    } catch (err) {
      throw { status: 500, message: "Error al obtener los KPIs del dashboard" };
    }
  }
}
