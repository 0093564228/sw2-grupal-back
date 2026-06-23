import nodemailer, { Transporter } from "nodemailer";

/**
 * Servicio de correo (Nodemailer + Gmail SMTP).
 *
 * Si no hay credenciales (SMTP_USER / SMTP_PASS) el servicio NO falla: solo
 * registra en consola lo que enviaría. Así el resto del sistema funciona igual
 * y los correos se activan en cuanto se configuren las credenciales en el .env.
 */
export class MailService {
  private readonly transporter: Transporter | null = null;
  private readonly from: string;

  constructor(opts: { user?: string; pass?: string; from?: string }) {
    this.from = opts.from || opts.user || "VET-ERP";
    // Las App Passwords de Google se muestran con espacios (solo visuales): los quitamos.
    const pass = opts.pass ? opts.pass.replace(/\s+/g, "") : "";
    if (opts.user && pass) {
      this.transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: { user: opts.user, pass },
      });
    }
  }

  /** Correo de confirmación (cuando la cita queda programada/confirmada). */
  async enviarConfirmacionCita(cita: any): Promise<void> {
    await this.enviar(cita, "confirmacion");
  }

  /** Correo de recordatorio (cita próxima). */
  async enviarRecordatorioCita(cita: any): Promise<void> {
    await this.enviar(cita, "recordatorio");
  }

  private async enviar(
    cita: any,
    tipo: "confirmacion" | "recordatorio",
  ): Promise<void> {
    try {
      const email: string | undefined = cita?.mascota?.propietario?.email;
      if (!email) return;

      const nombre = cita?.mascota?.propietario?.nombre || "Estimado/a cliente";
      const mascota = cita?.mascota?.nombre || "su mascota";
      const fecha = new Date(cita.fecha_hora);
      const fechaStr = fecha.toLocaleDateString("es-ES", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      const horaStr = fecha.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      });

      const esRec = tipo === "recordatorio";
      const titulo = esRec ? "Recordatorio de cita" : "Confirmación de cita";
      const asunto = `${titulo} — ${mascota}`;
      const intro = esRec
        ? `Le recordamos la próxima cita de ${mascota} en el Hospital Escuela de Veterinaria U.A.G.R.M.:`
        : `Le confirmamos la cita de ${mascota} en el Hospital Escuela de Veterinaria U.A.G.R.M.:`;

      const texto =
        `Hola ${nombre},\n\n${intro}\n\n` +
        `Fecha: ${fechaStr}\n` +
        `Hora: ${horaStr}\n` +
        (cita.motivo ? `Motivo: ${cita.motivo}\n` : "") +
        `\nPor favor llegue 10 minutos antes. Si no puede asistir, comuníquese para reprogramar.\n\n` +
        `Hospital Escuela de Veterinaria U.A.G.R.M.`;

      const html = `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;border:1px solid #eee;border-radius:12px;overflow:hidden">
          <div style="background:#facc15;padding:16px 24px">
            <h2 style="margin:0;color:#1e293b">${titulo}</h2>
            <p style="margin:4px 0 0;color:#1e293b;font-size:13px">Hospital Escuela de Veterinaria U.A.G.R.M.</p>
          </div>
          <div style="padding:24px;color:#334155">
            <p>Hola <strong>${nombre}</strong>,</p>
            <p>${intro}</p>
            <table style="margin:16px 0;font-size:15px">
              <tr><td style="padding:4px 0">📅 <strong>Fecha:</strong></td><td style="padding:4px 0 4px 12px">${fechaStr}</td></tr>
              <tr><td style="padding:4px 0">🕐 <strong>Hora:</strong></td><td style="padding:4px 0 4px 12px">${horaStr}</td></tr>
              ${cita.motivo ? `<tr><td style="padding:4px 0">📝 <strong>Motivo:</strong></td><td style="padding:4px 0 4px 12px">${cita.motivo}</td></tr>` : ""}
            </table>
            <p style="font-size:13px;color:#64748b">Por favor llegue 10 minutos antes. Si no puede asistir, comuníquese para reprogramar.</p>
          </div>
        </div>`;

      if (!this.transporter) {
        console.log(
          `[MailService] (sin credenciales SMTP) Se enviaría a ${email}: "${asunto}"`,
        );
        return;
      }

      await this.transporter.sendMail({
        from: this.from,
        to: email,
        subject: asunto,
        text: texto,
        html,
      });
      console.log(
        `[MailService] ${esRec ? "Recordatorio" : "Confirmación"} enviado a ${email}`,
      );
    } catch (err: any) {
      // Nunca interrumpir el flujo de la cita por un fallo de correo.
      console.error(
        "[MailService] No se pudo enviar el correo:",
        err?.message || err,
      );
    }
  }
}
