declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        rol_id: string;
        rol: string; // nombre del rol incluido en el JWT — evita query a BD en role.middleware
      };
    }
  }
}

export {};
