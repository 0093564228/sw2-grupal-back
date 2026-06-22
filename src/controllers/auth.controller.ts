import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import { ErrorHandler } from "../middlewares/error.middleware";

export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly errors: ErrorHandler,
  ) {}

  register = async (req: Request, res: Response) => {
    try {
      const result = await this.authService.register(req.body);
      res.status(201).json(result);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  login = async (req: Request, res: Response) => {
    try {
      const result = await this.authService.login(req.body);
      res.status(200).json(result);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };
}
