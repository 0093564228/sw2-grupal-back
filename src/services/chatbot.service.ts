import { GoogleGenerativeAI } from "@google/generative-ai";

const SYSTEM_PROMPT = `
Eres VET-AI, un asistente experto en emergencias y primeros auxilios veterinarios.
REGLAS:
1. SOLO respondes sobre salud animal y emergencias.
2. Si te preguntan otra cosa, di que solo ayudas con emergencias de mascotas.
3. Consejos críticos empiezan con: "⚠️ Este es un consejo de IA. Acude al veterinario."
4. Sé conciso y usa español.
`;

export class ChatbotService {
  private readonly genAI: GoogleGenerativeAI;

  constructor(private readonly apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async getEmergencyAdvice(userMessage: string, history: any[] = []) {
    try {
      if (!this.apiKey) {
        return "⚠️ Error: API KEY no configurada.";
      }

      const model = this.genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
      });

      const chatHistory = [
        {
          role: "user",
          parts: [
            {
              text: `Instrucciones de comportamiento: ${SYSTEM_PROMPT}\n\nPregunta inicial del usuario: Hola.`,
            },
          ],
        },
        {
          role: "model",
          parts: [
            {
              text: "Entendido. Soy VET-AI y estoy listo para asistir en emergencias veterinarias.",
            },
          ],
        },
        ...history
          .filter((h) => h.content && h.content.trim() !== "")
          .map((h) => ({
            role: h.role === "user" ? "user" : "model",
            parts: [{ text: h.content }],
          })),
      ];

      const chat = model.startChat({
        history: chatHistory,
      });

      const result = await chat.sendMessage(userMessage);
      const response = await result.response;
      return response.text();
    } catch (error: any) {
      console.error("Gemini Error:", error);

      // Backup: Intentar con gemini-pro si flash falla
      try {
        const modelPro = this.genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await modelPro.generateContent(
          `${SYSTEM_PROMPT}\n\nUsuario: ${userMessage}`,
        );
        return result.response.text();
      } catch (innerError) {
        throw {
          status: 500,
          message:
            "Lo siento, el servicio de IA de Google está teniendo problemas técnicos. Por favor, intenta de nuevo.",
        };
      }
    }
  }
}
