import { Request, Response } from "express";
import { DashboardService } from "../services/dashboard.service";
import { ErrorHandler } from "../middlewares/error.middleware";

export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly errors: ErrorHandler,
  ) {}

  getKpis = async (req: Request, res: Response) => {
    try {
      const kpis = await this.dashboardService.getKpis();
      res.json(kpis);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };
}
