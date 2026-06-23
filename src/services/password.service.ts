import bcrypt from "bcryptjs";

/** Longitud mínima de contraseña exigida por el backend (no confiar solo en el frontend). */
export const MIN_PASSWORD_LENGTH = 6;

/**
 * Servicio de contraseñas: validación de políticas + hashing/verificación con bcrypt.
 *
 * Reemplaza a helpers/password.ts y centraliza el uso de bcrypt que antes estaba
 * disperso en auth.service y usuarios.service. Al inyectarse por constructor,
 * el coste de hashing (saltRounds) es configurable y la lógica queda en un único lugar.
 */
export class PasswordService {
  constructor(private readonly saltRounds: number = 10) {}

  /**
   * Valida una contraseña explícita provista por el cliente.
   * Lanza un error claro si no cumple el mínimo. No aplica a los defaults
   * temporales generados por el sistema (esos se marcan con debe_cambiar_password).
   */
  validate(password: string): void {
    if (
      typeof password !== "string" ||
      password.trim().length < MIN_PASSWORD_LENGTH
    ) {
      throw new Error(
        `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`,
      );
    }
  }

  /**
   * Valida una contraseña NUEVA con política de seguridad reforzada:
   * mínimo 8 caracteres, al menos una mayúscula, una minúscula y un número.
   * Se usa al cambiar la contraseña desde el perfil.
   */
  validateStrong(password: string): void {
    const p = typeof password === "string" ? password : "";
    if (p.length < 8) {
      throw new Error("La contraseña debe tener al menos 8 caracteres");
    }
    if (!/[A-Z]/.test(p)) {
      throw new Error("La contraseña debe incluir al menos una letra mayúscula");
    }
    if (!/[a-z]/.test(p)) {
      throw new Error("La contraseña debe incluir al menos una letra minúscula");
    }
    if (!/[0-9]/.test(p)) {
      throw new Error("La contraseña debe incluir al menos un número");
    }
  }

  hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
