import { PrismaClient } from "@prisma/client";
import { TokenService } from "./token.service";
import { PasswordService } from "./password.service";
import { RegisterDto, LoginDto } from "../types";

export class AuthService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly tokenService: TokenService,
    private readonly passwordService: PasswordService,
  ) {}

  async register(data: RegisterDto) {
    try {
      const { nombre, email, password, telefono, rol_id } = data;
      const normalizedEmail = String(email).trim().toLowerCase();

      this.passwordService.validate(password);

      const existingUser = await this.prisma.usuario.findUnique({
        where: { email: normalizedEmail },
      });

      if (existingUser) {
        throw { status: 400, message: "Email is already registered" };
      }

      const password_hash = await this.passwordService.hash(password);

      // Necesitamos el nombre del rol para incluirlo en el token
      const rol = await this.prisma.role.findUnique({
        where: { id: rol_id },
        select: { nombre: true },
      });
      if (!rol) throw { status: 400, message: "Rol no válido" };

      const user = await this.prisma.usuario.create({
        data: {
          nombre,
          email: normalizedEmail,
          password_hash,
          telefono,
          rol_id,
        },
      });

      const { password_hash: _, ...userWithoutPassword } = user;

      // El token incluye 'rol' (nombre) para que role.middleware no consulte la BD
      const token = this.tokenService.generate({
        id: user.id,
        rol_id: user.rol_id,
        rol: rol.nombre,
      });

      return { user: userWithoutPassword, token };
    } catch (err: any) {
      throw {
        status: err?.status || 500,
        message: err?.message || "Error al registrar el usuario",
      };
    }
  }

  async login(data: LoginDto) {
    try {
      const { email, password } = data;
      const normalizedEmail = String(email).trim().toLowerCase();

      const user = await this.prisma.usuario.findUnique({
        where: { email: normalizedEmail },
        include: { rol: { select: { nombre: true } } },
      });

      if (!user) {
        throw { status: 401, message: "Invalid email or password" };
      }

      const isMatch = await this.passwordService.compare(
        password,
        user.password_hash,
      );

      if (!isMatch) {
        throw { status: 401, message: "Invalid email or password" };
      }

      if (!user.activo) {
        throw { status: 401, message: "Cuenta desactivada" };
      }

      const { password_hash: _, ...userWithoutPassword } = user;

      // El token incluye 'rol' (nombre) para que role.middleware no consulte la BD
      const token = this.tokenService.generate({
        id: user.id,
        rol_id: user.rol_id,
        rol: user.rol.nombre,
      });

      return { user: userWithoutPassword, token };
    } catch (err: any) {
      throw {
        status: err?.status || 500,
        message: err?.message || "Error al iniciar sesión",
      };
    }
  }
}
