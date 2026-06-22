import { PrismaClient } from "@prisma/client";

const productoInclude = { categoria: true };

export class ProductoService {
  constructor(private readonly prisma: PrismaClient) {}

  async getProductos(search?: string, categoria_id?: string) {
    try {
      return await this.prisma.producto.findMany({
        where: {
          ...(categoria_id ? { categoria_id } : {}),
          ...(search
            ? { nombre: { contains: search, mode: "insensitive" as const } }
            : {}),
        },
        include: productoInclude,
        orderBy: { nombre: "asc" },
      });
    } catch (err) {
      throw { status: 500, message: "Error al obtener los productos" };
    }
  }

  async getProductoById(id: string) {
    try {
      return await this.prisma.producto.findUnique({
        where: { id },
        include: productoInclude,
      });
    } catch (err) {
      throw { status: 500, message: "Error al obtener el producto" };
    }
  }

  async createProducto(data: {
    nombre: string;
    descripcion?: string;
    categoria_id?: string;
    precio_venta: number;
    stock_actual?: number;
    stock_minimo?: number;
  }) {
    try {
      return await this.prisma.producto.create({
        data,
        include: productoInclude,
      });
    } catch (err) {
      throw { status: 500, message: "Error al crear el producto" };
    }
  }

  async updateProducto(
    id: string,
    data: Partial<{
      nombre: string;
      descripcion: string;
      categoria_id: string;
      precio_venta: number;
      stock_actual: number;
      stock_minimo: number;
    }>,
  ) {
    try {
      return await this.prisma.producto.update({
        where: { id },
        data,
        include: productoInclude,
      });
    } catch (err) {
      throw { status: 500, message: "Error al actualizar el producto" };
    }
  }

  async deleteProducto(id: string) {
    try {
      return await this.prisma.producto.delete({ where: { id } });
    } catch (err) {
      throw { status: 500, message: "Error al eliminar el producto" };
    }
  }

  /**
   * Calcula el precio final aplicando descuento por volumen escalonado.
   * Tiers: >=50u→20%, >=20u→15%, >=10u→10%, >=5u→5%. Medicamentos +10%. Tope 25%.
   */
  calcularDescuentoPorVolumen(
    precio: number,
    cantidad: number,
    esCategoriaMedicamento: boolean,
  ): { precioFinal: number; descuentoPct: number; total: number } {
    if (precio <= 0) {
      throw { status: 400, message: "El precio debe ser mayor a cero" };
    }
    if (cantidad <= 0) {
      throw { status: 400, message: "La cantidad debe ser mayor a cero" };
    }

    const tiers = [
      { minCantidad: 50, descuento: 20 },
      { minCantidad: 20, descuento: 15 },
      { minCantidad: 10, descuento: 10 },
      { minCantidad: 5, descuento: 5 },
    ];

    let descuentoPct = 0;
    let i = 0;
    while (i < tiers.length) {
      if (cantidad >= tiers[i].minCantidad) {
        descuentoPct = tiers[i].descuento;
        break;
      }
      i++;
    }

    if (esCategoriaMedicamento) {
      descuentoPct += 10;
    }

    if (descuentoPct > 25) {
      descuentoPct = 25;
    }

    const precioFinal =
      Math.round(precio * (1 - descuentoPct / 100) * 100) / 100;
    const total = Math.round(precioFinal * cantidad * 100) / 100;

    return { precioFinal, descuentoPct, total };
  }

  async ajustarStock(
    id: string,
    cantidad: number,
    tipo: "INGRESO" | "SALIDA",
    motivo?: string,
  ) {
    try {
      const prod = await this.prisma.producto.findUniqueOrThrow({
        where: { id },
      });
      const nuevo_stock =
        tipo === "INGRESO"
          ? prod.stock_actual + cantidad
          : prod.stock_actual - cantidad;
      const [updated] = await this.prisma.$transaction([
        this.prisma.producto.update({
          where: { id },
          data: { stock_actual: nuevo_stock },
          include: productoInclude,
        }),
        this.prisma.kardexMovimiento.create({
          data: {
            producto_id: id,
            tipo,
            cantidad,
            saldo_final: nuevo_stock,
            motivo,
          },
        }),
      ]);
      return updated;
    } catch (err) {
      throw { status: 500, message: "Error al ajustar el stock del producto" };
    }
  }
}
