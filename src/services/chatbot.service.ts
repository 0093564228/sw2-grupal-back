import OpenAI from "openai";

const SYSTEM_PROMPT = `
Eres VET-AI, un asistente de PRIMEROS AUXILIOS veterinarios del Hospital Escuela de Veterinaria U.A.G.R.M.

TU OBJETIVO: guiar al propietario, paso a paso y con calma, sobre qué hacer con su mascota DESDE AHORA y HASTA QUE LLEGUE AL VETERINARIO. No reemplazas la atención profesional: estabilizas y orientas.

REGLAS:
1. Responde SOLO sobre salud y emergencias de mascotas. Si preguntan otra cosa, indícalo amablemente.
2. NUNCA diagnostiques ni indiques medicamentos o dosis. Orienta primeros auxilios, estabilización y traslado.
3. Si la descripción es vaga, haz 1 o 2 preguntas breves (especie, qué pasó, desde cuándo, cómo está).
4. Estructura tu respuesta en español claro y accionable:
   - Una frase corta de calma + gravedad.
   - "Haz esto:" pasos numerados, concretos.
   - "Evita:" qué NO hacer.
   - "Acude YA si:" señales de alarma.
   - Cierra SIEMPRE recomendando llevar la mascota al veterinario y, si puede, llamar antes para avisar.
5. En casos críticos empieza con "⚠️".
6. Sé conciso (máx. ~180 palabras), con tono tranquilo y empático.
`;

// ── Respaldo SIN IA: guías de primeros auxilios por síntoma ──────────────────
const DISCLAIMER = "⚠️ Primeros auxilios — NO reemplaza al veterinario.\n\n";

const CTA =
  "\n\n➡️ En todos los casos, lleva a tu mascota al veterinario lo antes posible. Si puedes, llama antes para que te esperen y avisa qué ocurrió.";

const GENERICO =
  "No logré identificar la emergencia con claridad. Mientras tanto:\n" +
  "1. Mantén a tu mascota tranquila, abrigada y en un lugar seguro.\n" +
  "2. No le des comida, agua a la fuerza ni medicamentos sin indicación.\n" +
  "3. Observa su respiración, encías (deben ser rosadas) y nivel de consciencia.\n\n" +
  "Acude YA si: no respira o respira con dificultad, sangra mucho, convulsiona, está inconsciente o muy decaído.\n\n" +
  'Cuéntame el síntoma principal (por ej.: "comió chocolate", "se ahoga", "sangra", "convulsiona", "abdomen hinchado") para darte una guía específica.';

const PRIMEROS_AUXILIOS: { kw: string[]; texto: string }[] = [
  {
    kw: [
      "chocolate", "veneno", "intoxic", "comio", "comió", "raticida",
      "toxico", "tóxico", "planta", "pastilla", "medicament", "envenen",
      "ingirio", "ingirió", "detergente", "veneno para ratas",
    ],
    texto:
      "⚠️ Posible INTOXICACIÓN.\n\n" +
      "Haz esto:\n1. Aleja a la mascota del producto y guarda el envase/etiqueta o una foto.\n2. Anota qué ingirió, cuánto y hace cuánto tiempo.\n3. Mantenla tranquila y abrigada; vigila su respiración.\n\n" +
      "Evita:\n• Inducir el vómito por tu cuenta (algunos tóxicos dañan más al vomitar).\n• Darle leche, comida o remedios caseros.\n\n" +
      "Acude YA si: vomita, tiembla, babea mucho, convulsiona o está decaído.",
  },
  {
    kw: [
      "atragant", "atorado", "hueso atorado", "algo en la garganta",
      "se ahoga", "no puede respirar", "tose y", "objeto en la boca",
    ],
    texto:
      "⚠️ ATRAGANTAMIENTO (algo obstruye la vía aérea).\n\n" +
      "Haz esto:\n1. Abre la boca y mira; retira el objeto SOLO si lo ves y puedes sacarlo sin empujarlo.\n2. Perro pequeño/gato: sostenlo boca abajo y da palmadas firmes entre los omóplatos.\n3. Perro grande: abrázalo por detrás y haz compresiones firmes hacia arriba justo detrás de las costillas (tipo Heimlich).\n\n" +
      "Evita:\n• Meter los dedos a ciegas (puedes empujar el objeto).\n\n" +
      "Acude YA si: se desmaya, sus encías se ponen azules/pálidas o no logras sacar el objeto.",
  },
  {
    kw: [
      "inconsciente", "no responde", "desmay", "no respira", "no late",
      "sin pulso", "paro", "colaps", "no reacciona", "se desmayo",
    ],
    texto:
      "⚠️ INCONSCIENTE / NO RESPONDE — emergencia crítica.\n\n" +
      "Haz esto:\n1. Revisa si respira (mira el pecho) y si tiene pulso/latido (lado izquierdo del pecho).\n2. Estira el cuello, abre la boca y saca la lengua para liberar la vía aérea.\n3. Si NO respira: 2 soplos suaves por la nariz (con la boca cerrada).\n4. Si NO hay latido: compresiones firmes en el pecho (100-120 por minuto) mientras alguien conduce al veterinario.\n\n" +
      "Evita:\n• Perder tiempo: trasládala de inmediato mientras la reanimas.\n\n" +
      "Acude YA: es una emergencia de vida o muerte.",
  },
  {
    kw: ["sangr", "herida", "corte", "hemorragia", "sangre", "se corto", "se cortó"],
    texto:
      "SANGRADO / HERIDA.\n\n" +
      "Haz esto:\n1. Aplica presión firme y continua con una gasa o paño limpio durante 5 minutos sin levantar.\n2. Si traspasa, pon otra gasa encima (no retires la primera).\n3. Cubre la herida y mantén a la mascota quieta.\n\n" +
      "Evita:\n• Torniquetes, salvo hemorragia masiva en una pata y solo por poco tiempo.\n• Echar alcohol, polvos o remedios caseros en la herida.\n\n" +
      "Acude YA si: el sangrado no para en 10 min, la herida es profunda o está muy débil.",
  },
  {
    kw: ["convuls", "ataque", "temblor", "espasmo", "convulsion", "epilep"],
    texto:
      "⚠️ CONVULSIONES.\n\n" +
      "Haz esto:\n1. Aleja objetos para que no se golpee; baja luces y ruido.\n2. NO la sujetes; deja que pase la convulsión.\n3. Anota a qué hora empezó y cuánto dura.\n\n" +
      "Evita:\n• Meterle la mano o algo en la boca (puede morderte; no se traga la lengua).\n\n" +
      "Acude YA si: dura más de 3-5 minutos, se repiten seguidas o no recupera la consciencia.",
  },
  {
    kw: ["calor", "golpe de calor", "insolaci", "jadea mucho", "sobrecalent", "acalorad"],
    texto:
      "⚠️ GOLPE DE CALOR.\n\n" +
      "Haz esto:\n1. Llévala a un lugar fresco y con sombra.\n2. Moja su cuerpo con agua FRESCA (no helada), sobre todo patas, ingle, axilas y barriga.\n3. Ofrece agua en poca cantidad si está consciente; pon un ventilador si tienes.\n\n" +
      "Evita:\n• Agua helada o hielo directo (empeora el cuadro).\n• Tapar o encerrar a la mascota.\n\n" +
      "Acude YA si: jadea sin parar, babea espeso, vomita o se tambalea (aunque parezca mejorar).",
  },
  {
    kw: ["fractura", "cojea", "cojo", "atropell", "se cayo", "se cayó", "golpe", "fractur", "quebro", "quebró", "trauma"],
    texto:
      "POSIBLE FRACTURA / TRAUMATISMO (golpe o atropello).\n\n" +
      "Haz esto:\n1. Mueve a la mascota lo menos posible; usa una tabla o manta rígida como camilla.\n2. Si hay herida abierta, cúbrela con gasa limpia.\n3. Mantenla abrigada y tranquila para prevenir el shock.\n\n" +
      "Evita:\n• Intentar acomodar el hueso o entablillar con fuerza.\n• Darle de comer o beber (por si necesita cirugía).\n\n" +
      "Acude YA si: hubo atropello/caída fuerte, no apoya la pata, sangra o está muy decaída.",
  },
  {
    kw: ["vomit", "vómit", "diarrea", "no come", "deshidrat", "vomita"],
    texto:
      "VÓMITO o DIARREA.\n\n" +
      "Haz esto:\n1. Retira el alimento unas horas (no el agua) para descansar el estómago.\n2. Ofrece agua en poca cantidad y seguido para que no se deshidrate.\n3. Vigila si hay sangre, decaimiento o si no retiene ni el agua.\n\n" +
      "Evita:\n• Darle medicamentos humanos o comida grasosa.\n\n" +
      "Acude YA si: hay sangre, dura más de 24 h, es cachorro/anciano, está muy decaído o el abdomen se ve hinchado.",
  },
  {
    kw: ["quemad", "quemadura", "fuego", "agua caliente", "acido", "ácido", "se quemo", "se quemó"],
    texto:
      "QUEMADURA.\n\n" +
      "Haz esto:\n1. Enfría la zona con agua fresca (no helada) durante varios minutos.\n2. Cúbrela con una gasa limpia y húmeda.\n3. Mantén a la mascota tranquila.\n\n" +
      "Evita:\n• Cremas, pasta dental, mantequilla o hielo directo.\n• Reventar ampollas.\n\n" +
      "Acude YA si: la quemadura es grande, profunda, en cara/ojos o fue por químicos/electricidad.",
  },
  {
    kw: ["parto", "dando a luz", "pariendo", "distocia", "no puede parir", "cachorros atascad", "contracciones"],
    texto:
      "PARTO con dificultad (posible distocia).\n\n" +
      "Haz esto:\n1. Dale un espacio tranquilo, tibio y limpio; obsérvala sin agobiar.\n2. Anota cuánto lleva con contracciones y cuántas crías nacieron.\n3. Si una cría está atascada y a la vista, puedes ayudar con suavidad hacia abajo SOLO durante una contracción.\n\n" +
      "Evita:\n• Jalar con fuerza o usar objetos.\n\n" +
      "Acude YA si: lleva más de 30-60 min de contracciones fuertes sin que nazca una cría, hay secreción verde/sanguinolenta sin cría, o está muy débil.",
  },
  {
    kw: ["mordedura", "mordio", "mordió", "picadura", "picado", "serpiente", "vibora", "víbora", "abeja", "avispa", "alacran", "alacrán", "escorpion"],
    texto:
      "MORDEDURA o PICADURA (otro animal, serpiente o insecto).\n\n" +
      "Haz esto:\n1. Mantén a la mascota quieta y calmada (el movimiento esparce el veneno más rápido).\n2. Si es en una pata, mantenla a la altura del corazón o más abajo.\n3. Limpia mordeduras de otros animales con agua y cúbrelas.\n4. Si ves el aguijón de abeja, ráspalo con una tarjeta (no lo aprietes).\n\n" +
      "Evita:\n• Hacer cortes, succionar el veneno o aplicar torniquetes.\n\n" +
      "Acude YA si: fue serpiente, hay hinchazón rápida, dificultad para respirar, vómito o decaimiento.",
  },
  {
    kw: ["ojo", "ocular", "vista", "se lastimo el ojo", "ojo rojo", "no abre el ojo", "secrecion en el ojo"],
    texto:
      "LESIÓN o PROBLEMA en el OJO.\n\n" +
      "Haz esto:\n1. Evita que se rasque o se frote (un cono o vendaje suave ayuda).\n2. Si hay un químico, enjuaga el ojo con suero fisiológico o agua limpia varios minutos.\n3. Cubre con una gasa húmeda y limpia si está muy irritado.\n\n" +
      "Evita:\n• Gotas o pomadas humanas sin indicación.\n• Tocar o intentar sacar algo clavado en el ojo.\n\n" +
      "Acude YA si: el ojo está muy rojo, salido, con sangre, o no lo puede abrir.",
  },
  {
    kw: ["trago", "tragó", "se comio un objeto", "cuerpo extrano", "cuerpo extraño", "juguete", "moneda", "media", "calcetin", "plastico", "hueso de pollo"],
    texto:
      "INGIRIÓ UN OBJETO (cuerpo extraño).\n\n" +
      "Haz esto:\n1. Si respira bien, mantenla tranquila y vigílala.\n2. Anota qué tragó, el tamaño y a qué hora.\n3. Revisa si vomita, hace arcadas, deja de comer o el abdomen se hincha.\n\n" +
      "Evita:\n• Provocar el vómito (objetos punzantes o cuerdas pueden causar más daño al subir).\n• Darle laxantes.\n\n" +
      "Acude YA si: se atraganta, vomita repetido, no defeca, está decaída o tragó algo punzante, una cuerda o un imán.",
  },
  {
    kw: ["abdomen hinchado", "panza hinchada", "barriga hinchada", "estomago hinchado", "torsion", "torsión", "inflado", "timpanismo", "se hincho"],
    texto:
      "⚠️ ABDOMEN HINCHADO / DURO (posible torsión gástrica) — urgencia crítica, sobre todo en perros grandes.\n\n" +
      "Haz esto:\n1. NO le des comida ni agua.\n2. Trasládala de inmediato al veterinario; cada minuto cuenta.\n3. Mantenla tranquila y de pie o echada de lado.\n\n" +
      "Evita:\n• Esperar a ver si mejora o presionar la barriga.\n\n" +
      "Acude YA: si la barriga está hinchada/dura, intenta vomitar sin lograrlo, babea y se ve inquieta, es una EMERGENCIA inmediata.",
  },
  {
    kw: ["electrocut", "cable", "corriente", "descarga electrica", "descarga eléctrica", "mordio un cable"],
    texto:
      "⚠️ ELECTROCUCIÓN (mordió un cable o descarga).\n\n" +
      "Haz esto:\n1. PRIMERO corta la corriente (desconecta el cable) antes de tocar a la mascota.\n2. Si no puedes, sepárala de la fuente con algo de madera o plástico seco, nunca con las manos.\n3. Revisa si respira; cúbrela y mantenla abrigada.\n\n" +
      "Evita:\n• Tocarla mientras siga en contacto con la corriente.\n\n" +
      "Acude YA si: tiene quemaduras en la boca, tose, respira con dificultad o está decaída (puede haber daño pulmonar tardío).",
  },
  {
    kw: ["se ahogo en el agua", "piscina", "rio", "río", "se cayo al agua", "casi se ahoga", "sumergi", "trago agua"],
    texto:
      "AHOGAMIENTO en agua.\n\n" +
      "Haz esto:\n1. Sácala del agua y sostenla con la cabeza más abajo que el cuerpo para que drene el agua.\n2. Para perros pequeños, puedes sujetarla por las patas traseras boca abajo unos segundos y mover con suavidad.\n3. Si no respira, da soplos suaves por la nariz y traslada de inmediato.\n\n" +
      "Evita:\n• Asumir que está bien si tosió y respira: puede empeorar horas después.\n\n" +
      "Acude YA: aunque se recupere, llévala para revisión por riesgo pulmonar.",
  },
];

function respuestaPrimerosAuxilios(userMessage: string): string {
  const t = (userMessage || "").toLowerCase();
  // Elegimos el tema con MÁS coincidencias de palabras clave (no la primera).
  let mejor: { kw: string[]; texto: string } | null = null;
  let mejorPuntaje = 0;
  for (const item of PRIMEROS_AUXILIOS) {
    const puntaje = item.kw.reduce((acc, k) => acc + (t.includes(k) ? 1 : 0), 0);
    if (puntaje > mejorPuntaje) {
      mejorPuntaje = puntaje;
      mejor = item;
    }
  }
  const cuerpo = mejorPuntaje > 0 && mejor ? mejor.texto : GENERICO;
  return DISCLAIMER + cuerpo + CTA;
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
        temperature: 0.5,
        max_tokens: 600,
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
