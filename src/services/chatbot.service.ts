import OpenAI from "openai";

const SYSTEM_PROMPT = `
Eres VET-AI, un asistente experto en emergencias y primeros auxilios veterinarios.
REGLAS:
1. SOLO respondes sobre salud animal y emergencias.
2. Si te preguntan otra cosa, di que solo ayudas con emergencias de mascotas.
3. Consejos críticos empiezan con: "⚠️ Este es un consejo de IA. Acude al veterinario."
4. Sé conciso y usa español.
`;

// ── Respaldo SIN IA: guías de primeros auxilios por síntoma ──────────────────
const DISCLAIMER =
  "⚠️ Orientación inicial — NO reemplaza al veterinario. Acude o llama a tu veterinario cuanto antes.\n\n";

const GENERICO =
  'No logré identificar la emergencia con claridad. Mientras tanto:\n' +
  '• Mantén a tu mascota tranquila, abrigada y vigilada.\n' +
  '• No le des comida ni medicamentos sin indicación.\n' +
  '• Si tiene dificultad para respirar, sangrado abundante, convulsiones o no responde, acude de INMEDIATO al veterinario.\n' +
  'Describe el síntoma principal (por ej.: "comió chocolate", "se ahoga", "sangra", "convulsiona") para darte una guía más específica.';

const PRIMEROS_AUXILIOS: { kw: string[]; texto: string }[] = [
  {
    kw: ["chocolate", "veneno", "intoxic", "comió", "comio", "raticida", "tóxico", "toxico", "planta", "pastilla", "medicament", "envenen"],
    texto:
      "Posible INTOXICACIÓN:\n• No induzcas el vómito sin indicación profesional (algunos tóxicos dañan más al vomitar).\n• Retira el resto del producto y guarda el envase/etiqueta.\n• Mantén a la mascota tranquila y abrigada.\n• Acude de inmediato con la info de qué y cuánto ingirió.",
  },
  {
    kw: ["ahog", "atragant", "no respira", "no puede respirar", "se asfixia", "asfixia", "hueso atorado", "atorado"],
    texto:
      "ATRAGANTAMIENTO:\n• Abre la boca y revisa; retira el objeto solo si puedes sin empujarlo más.\n• Perro pequeño: sostenlo boca abajo y da palmadas firmes entre los omóplatos.\n• Perro grande: compresiones firmes hacia arriba detrás de las costillas (tipo Heimlich).\n• Si pierde el conocimiento, acude YA al veterinario.",
  },
  {
    kw: ["sangr", "herida", "corte", "hemorragia", "sangre"],
    texto:
      "SANGRADO/HERIDA:\n• Aplica presión firme con gasa o paño limpio 5 minutos sin levantar.\n• Si traspasa, añade otra gasa encima (no retires la primera).\n• Evita torniquetes salvo hemorragia extrema en una pata.\n• Cubre y traslada al veterinario.",
  },
  {
    kw: ["convuls", "ataque", "temblor", "espasmo"],
    texto:
      "CONVULSIONES:\n• No la sujetes ni le pongas nada en la boca.\n• Aleja objetos para que no se lastime y baja luces/ruido.\n• Anota cuánto dura.\n• Si dura más de 3–5 min o se repiten, es EMERGENCIA: acude de inmediato.",
  },
  {
    kw: ["calor", "golpe de calor", "insolaci", "jadea mucho", "sobrecalent"],
    texto:
      "GOLPE DE CALOR:\n• Llévala a un lugar fresco y con sombra.\n• Moja su cuerpo con agua FRESCA (no helada), sobre todo patas, ingle y axilas.\n• Ofrece agua en poca cantidad si está consciente.\n• Acude al veterinario aunque parezca mejorar.",
  },
  {
    kw: ["fractura", "cojea", "cojo", "hueso", "atropell", "se cayó", "se cayo", "golpe", "fractur"],
    texto:
      "POSIBLE FRACTURA / TRAUMATISMO:\n• Mueve a la mascota lo menos posible; usa una superficie rígida como camilla.\n• No intentes acomodar el hueso.\n• Si hay herida abierta, cúbrela con gasa limpia.\n• Traslada con cuidado al veterinario.",
  },
  {
    kw: ["vómit", "vomit", "diarrea", "no come", "deshidrat"],
    texto:
      "VÓMITO o DIARREA:\n• Retira el alimento unas horas (no el agua); ofrece agua en poca cantidad y seguido.\n• Vigila sangre, decaimiento intenso o que no retenga agua.\n• Si hay sangre, dura más de 24 h, el animal está muy decaído o es cachorro, acude al veterinario.",
  },
  {
    kw: ["quemad", "quemadura", "fuego", "agua caliente", "ácido", "acido"],
    texto:
      "QUEMADURA:\n• Enfría la zona con agua fresca (no helada) varios minutos.\n• No apliques cremas, pasta dental ni hielo.\n• Cubre con gasa limpia húmeda y acude al veterinario.",
  },
];

function respuestaPrimerosAuxilios(userMessage: string): string {
  const t = (userMessage || "").toLowerCase();
  const item = PRIMEROS_AUXILIOS.find((x) => x.kw.some((k) => t.includes(k)));
  return (
    DISCLAIMER +
    (item ? item.texto : GENERICO) +
    "\n\n(Asistente en modo básico; vuelve a intentar más tarde para una orientación con IA.)"
  );
}

export class ChatbotService {
  private readonly openai: OpenAI | null;

  constructor(private readonly apiKey: string) {
    // Sin clave no se construye el cliente: se usa el respaldo de primeros auxilios.
    this.openai = apiKey ? new OpenAI({ apiKey }) : null;
  }

  async getEmergencyAdvice(userMessage: string, history: any[] = []) {
    if (!this.openai) {
      return respuestaPrimerosAuxilios(userMessage);
    }

    const mensajes: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM_PROMPT },
    ];
    for (const h of history) {
      if (h?.content && String(h.content).trim() !== "") {
        mensajes.push({
          role: h.role === "user" ? "user" : "assistant",
          content: String(h.content),
        });
      }
    }
    mensajes.push({ role: "user", content: userMessage });

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: mensajes,
        temperature: 0.6,
        max_tokens: 500,
      });
      const texto = completion.choices[0]?.message?.content?.trim();
      return texto || respuestaPrimerosAuxilios(userMessage);
    } catch (error: any) {
      // IA no disponible (cuota/clave/red) → respaldo de primeros auxilios.
      console.error(
        "OpenAI no disponible, usando respaldo:",
        error?.message || error,
      );
      return respuestaPrimerosAuxilios(userMessage);
    }
  }
}
