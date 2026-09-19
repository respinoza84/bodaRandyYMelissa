import { Resend } from "resend";
import { wedding } from "@/config/wedding";
import { invitationUrl } from "./whatsapp";

const resend = () => new Resend(process.env.RESEND_API_KEY);
const from = () => process.env.EMAIL_FROM || wedding.emailFrom;

export async function sendInvitationEmail(to: string, contactName: string, code: string, guestCount: number) {
  const url = invitationUrl(code);
  const reserved = guestCount === 1 ? "1 espacio" : `${guestCount} espacios`;
  return resend().emails.send({
    from: from(),
    to,
    subject: `${wedding.couple} — Estás invitado/a a nuestra boda`,
    html: `
      <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:32px;color:#2b2b2b">
        <p style="font-size:14px;margin:0 0 24px">Hola ${contactName},</p>
        <h1 style="font-weight:normal;font-size:28px;margin:0 0 8px">${wedding.couple}</h1>
        <p style="margin:0 0 24px">${wedding.dateLabel} · ${wedding.timeLabel}<br>${wedding.venue}</p>
        <p>Nos haría muy felices contar con ustedes. Hemos reservado <strong>${reserved}</strong> para su invitación. Abran la invitación y confirmen su asistencia antes del <strong>${wedding.rsvpDeadlineLabel}</strong>.</p>
        <p style="margin:32px 0">
          <a href="${url}" style="background:#2b2b2b;color:#fff;padding:14px 24px;text-decoration:none;border-radius:4px">Ver invitación y confirmar</a>
        </p>
        <p style="font-size:12px;color:#777">Si el botón no funciona, copien este enlace: ${url}</p>
      </div>`,
  });
}

export async function sendConfirmationEmail(to: string, contactName: string, confirmed: string[], declined: string[]) {
  return resend().emails.send({
    from: from(),
    to,
    subject: `Recibimos su confirmación — ${wedding.couple}`,
    html: `
      <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:32px;color:#2b2b2b">
        <p>Hola ${contactName}, ¡gracias por responder!</p>
        ${confirmed.length ? `<p>Nos acompañan: <strong>${confirmed.join(", ")}</strong></p>` : ""}
        ${declined.length ? `<p>No podrán asistir: ${declined.join(", ")}</p>` : ""}
        <p>${wedding.dateLabel} · ${wedding.timeLabel}<br>${wedding.venue}<br><a href="${wedding.mapsUrl}">Cómo llegar</a></p>
        <p>Pueden cambiar su respuesta en cualquier momento desde el mismo enlace de la invitación.</p>
      </div>`,
  });
}
