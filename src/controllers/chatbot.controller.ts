import { Request, Response } from "express";
import { ChatbotService } from "../services/chatbot.service";
import { ErrorHandler } from "../middlewares/error.middleware";

export class ChatbotController {
  constructor(
    private readonly chatbotService: ChatbotService,
    private readonly errors: ErrorHandler,
  ) {}

  handleEmergencyChat = async (req: Request, res: Response) => {
    try {
      const { message, history } = req.body;
      if (!message) return res.status(400).json({ error: "Mensaje requerido" });

      const reply = await this.chatbotService.getEmergencyAdvice(
        message,
        history,
      );
      res.json({ reply });
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };
}
