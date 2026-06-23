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

  /** Lista pública (para usuarios logueados) de veterinarios activos para asignación. */
  async getVeterinarios() {
    try {
      return await this.prisma.usuario.findMany({
        where: { rol: { nombre: "VETERINARIO" }, activo: true },
        select: { id: true, nombre: true },
        orderBy: { nombre: "asc" },
      });
    } catch (err) {
      throw { status: 500, message: "Error al obtener los veterinarios" };
    }
  }

  /**
   * Búsqueda de propietarios (usuarios rol CLIENTE) para que recepción/clínica
   * pueda asociar mascotas sin requerir el endpoint /usuarios (solo-admin).
   */
  async getPropietarios(search?: string) {
    try {
      return await this.prisma.usuario.findMany({
        where: {
          rol: { nombre: "CLIENTE" },
          ...(search
            ? {
                OR: [
                  { nombre: { contains: search, mode: "insensitive" } },
                  { ci: { contains: search, mode: "insensitive" } },
                  { email: { contains: search, mode: "insensitive" } },
                  { telefono: { contains: search, mode: "insensitive" } },
                ],
              }
            : {}),
        },
        select: {
          id: true,
          nombre: true,
          email: true,
          telefono: true,
          ci: true,
        },
        orderBy: { nombre: "asc" },
        take: 20,
      });
    } catch (err) {
      throw { status: 500, message: "Error al obtener los propietarios" };
    }
  }
}
