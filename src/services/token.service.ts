import jwt, { SignOptions } from "jsonwebtoken";
import { JwtPayload } from "../types";

/**
 * Servicio de tokens JWT (firma y verificación).
 *
 * Reemplaza a helpers/jwt.ts: ahora es una clase inyectable cuyo secreto y
 * expiración se proveen por constructor desde el composition root (container.ts),
 * en lugar de leerse de process.env a nivel de módulo. Esto la hace testeable
 * (se puede instanciar con un secreto de prueba) y desacoplada del entorno.
 */
export class TokenService {
  constructor(
    private readonly secret: string,
    private readonly expiresIn: SignOptions["expiresIn"] = "1d",
  ) {
    if (!secret) {
      throw new Error(
        "JWT_SECRET no está definido. TokenService requiere un secreto real para firmar tokens.",
      );
    }
  }

  generate(payload: JwtPayload): string {
    return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn }); // expira en 1 día
  }

  verify(token: string): JwtPayload | null {
    try {
      return jwt.verify(token, this.secret) as JwtPayload;
    } catch {
      return null; // token inválido, expirado o manipulado → retorna null (no lanza)
    }
  }
}
