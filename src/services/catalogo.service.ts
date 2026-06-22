import { PrismaClient } from "@prisma/client";

export class CatalogoService {
  constructor(private readonly prisma: PrismaClient) {}

  async getEspecies() {
    try {
      return await this.prisma.especie.findMany({
        include: { razas: true },
        orderBy: { nombre: "asc" },
      });
    } catch (err) {
      throw { status: 500, message: "Error al obtener las especies" };
    }
  }

  async getRazas(especie_id?: string) {
    try {
      return await this.prisma.raza.findMany({
        where: especie_id ? { especie_id } : undefined,
        include: { especie: true },
        orderBy: { nombre: "asc" },
      });
    } catch (err) {
      throw { status: 500, message: "Error al obtener las razas" };
    }
  }

  async getColores() {
    try {
      return await this.prisma.colorMascota.findMany({
        orderBy: { descripcion: "asc" },
      });
    } catch (err) {
      throw { status: 500, message: "Error al obtener los colores" };
    }
  }

  async getAlergias() {
    try {
      return await this.prisma.alergia.findMany({ orderBy: { nombre: "asc" } });
    } catch (err) {
      throw { status: 500, message: "Error al obtener las alergias" };
    }
  }

  async getServicios() {
    try {
      return await this.prisma.catalogoServicio.findMany({
        orderBy: { nombre: "asc" },
      });
    } catch (err) {
      throw { status: 500, message: "Error al obtener los servicios" };
    }
  }

  async getExamenes() {
    try {
      return await this.prisma.catalogoExamen.findMany({
        orderBy: { nombre: "asc" },
      });
    } catch (err) {
      throw { status: 500, message: "Error al obtener los exámenes" };
    }
  }

  async getCategorias() {
    try {
      return await this.prisma.categoriaProducto.findMany({
        orderBy: { nombre: "asc" },
      });
    } catch (err) {
      throw { status: 500, message: "Error al obtener las categorías" };
    }
  }

  async getRoles() {
    try {
      return await this.prisma.role.findMany({ orderBy: { nombre: "asc" } });
    } catch (err) {
      throw { status: 500, message: "Error al obtener los roles" };
    }
  }
}
