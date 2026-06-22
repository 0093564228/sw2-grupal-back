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

  hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
