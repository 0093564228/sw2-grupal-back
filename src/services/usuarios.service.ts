import { PrismaClient } from "@prisma/client";
import { PasswordService } from "./password.service";
import {
  CreateUsuarioDto,
  UpdateUsuarioDto,
  CreatePropietarioDto,
} from "../types";

const usuarioSelect = {
  id: true,
  nombre: true,
  email: true,
  telefono: true,
  ci: true,
  rol: true,
  created_at: true,
  _count: { select: { mascotas: true } },
};

export class UsuariosService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly passwordService: PasswordService,
  ) {}

  async getUsuarios(rol?: string, search?: string) {
    try {
      return await this.prisma.usuario.findMany({
        where: {
          ...(rol ? { rol: { nombre: rol } } : {}),
          ...(search
            ? {
                OR: [
                  { nombre: { contains: search, mode: "insensitive" } },
                  { email: { contains: search, mode: "insensitive" } },
                  { ci: { contains: search, mode: "insensitive" } },
                ],
              }
            : {}),
        },
        select: usuarioSelect,
        orderBy: { nombre: "asc" },
      });
    } catch (err) {
      throw { status: 500, message: "Error al obtener los usuarios" };
    }
  }

  async getUsuarioById(id: string) {
    try {
      return await this.prisma.usuario.findUnique({
        where: { id },
        select: usuarioSelect,
      });
    } catch (err) {
      throw { status: 500, message: "Error al obtener el usuario" };
    }
  }

  async createUsuario(data: CreateUsuarioDto) {
    try {
      const { password, ...rest } = data;
      const normalizedEmail = data.email.trim().toLowerCase();

      let rawPassword: string;
      let debeCambiar: boolean;
      if (password && password.trim().length > 0) {
        this.passwordService.validate(password);
        rawPassword = password;
        debeCambiar = false;
      } else {
        // Default temporal para personal: el ERP es crítico, forzar cambio en el 1er ingreso.
        rawPassword = "cambiar123";
        debeCambiar = true;
      }
      const hash = await this.passwordService.hash(rawPassword);
      return await this.prisma.usuario.create({
        data: {
          ...rest,
          email: normalizedEmail,
          password_hash: hash,
          debe_cambiar_password: debeCambiar,
        },
        select: usuarioSelect,
      });
    } catch (err: any) {
      throw {
        status: err?.status || 500,
        message: err?.message || "Error al crear el usuario",
      };
    }
  }

  async updateUsuario(id: string, data: UpdateUsuarioDto) {
    try {
      return await this.prisma.usuario.update({
        where: { id },
        data,
        select: usuarioSelect,
      });
    } catch (err) {
      throw { status: 500, message: "Error al actualizar el usuario" };
    }
  }

  async deleteUsuario(id: string) {
    try {
      return await this.prisma.usuario.delete({ where: { id } });
    } catch (err) {
      throw { status: 500, message: "Error al eliminar el usuario" };
    }
  }

  /**
   * Busca un propietario (cliente) por email o lo crea si no existe.
   * ÚNICA fuente de verdad para la creación de usuarios con rol CLIENTE.
   * Utilizado por mascotaService para evitar duplicar lógica de creación de usuarios.
   */
  async findOrCreateCliente(
    data: CreatePropietarioDto,
  ): Promise<{ id: string }> {
    try {
      const normalizedEmail = data.email.trim().toLowerCase();

      // Si ya existe, simplemente retornamos — no creamos duplicados
      const existing = await this.prisma.usuario.findUnique({
        where: { email: normalizedEmail },
      });
      if (existing) return existing;

      const rolCliente = await this.prisma.role.findFirst({
        where: { nombre: "CLIENTE" },
      });
      if (!rolCliente) {
        throw {
          status: 500,
          message: "Rol CLIENTE no encontrado en la base de datos",
        };
      }

      let rawPassword: string;
      let debeCambiar: boolean;
      if (data.password && data.password.trim().length > 0) {
        this.passwordService.validate(data.password);
        rawPassword = data.password;
        debeCambiar = false;
      } else {
        // NUNCA usar el CI (es semi-público). Default genérico + obligar cambio.
        rawPassword = "cliente123";
        debeCambiar = true;
      }
      const hash = await this.passwordService.hash(rawPassword);

      return await this.prisma.usuario.create({
        data: {
          nombre: data.nombre,
          email: normalizedEmail,
          password_hash: hash,
          telefono: data.telefono,
          ci: data.ci,
          rol_id: rolCliente.id,
          debe_cambiar_password: debeCambiar,
        },
      });
    } catch (err: any) {
      throw {
        status: err?.status || 500,
        message: err?.message || "Error al crear el propietario",
      };
    }
  }
}
