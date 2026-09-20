import { Resend } from "resend";
import { wedding } from "@/config/wedding";
import { invitationUrl } from "./whatsapp";

const resend = () => new Resend(process.env.RESEND_API_KEY);
const from = () => process.env.EMAIL_FROM || wedding.emailFrom;

const shell = (inner: string) =>
  `<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:32px;color:#2b2b2b">${inner}</div>`;
const button = (url: string, label: string) =>
  `<p style="margin:32px 0"><a href="${url}" style="background:#2b2b2b;color:#fff;padding:14px 24px;text-decoration:none;border-radius:4px">${label}</a></p>` +
  `<p style="font-size:12px;color:#777">Si el botón no funciona, copien este enlace: ${url}</p>`;

export function buildInvitationEmail(to: string, contactName: string, code: string, guestCount: number) {
  const url = invitationUrl(code);
  const reserved = guestCount === 1 ? "1 espacio" : `${guestCount} espacios`;
  return {
    from: from(),
    to,
    subject: `${wedding.couple} — Estás invitado/a a nuestra boda`,
    html: shell(`
        <p style="font-size:14px;margin:0 0 24px">Hola ${contactName},</p>
        <h1 style="font-weight:normal;font-size:28px;margin:0 0 8px">${wedding.couple}</h1>
        <p style="margin:0 0 24px">${wedding.dateLabel} · ${wedding.timeLabel}<br>${wedding.venue}</p>
        <p>Nos haría muy felices contar con ustedes. Hemos reservado <strong>${reserved}</strong> para su invitación. Abran la invitación y confirmen su asistencia antes del <strong>${wedding.rsvpDeadlineLabel}</strong>.</p>
        ${button(url, "Ver invitación y confirmar")}`),
  };
}

// Recordatorio para quienes aún no confirman: nombra a las personas pendientes de la invitación.
export function buildReminderEmail(to: string, contactName: string, code: string, pendingNames: string[]) {
  const url = invitationUrl(code);
  return {
    from: from(),
    to,
    subject: `Recordatorio: confirmen su asistencia — ${wedding.couple}`,
    html: shell(`
        <p style="font-size:14px;margin:0 0 24px">Hola ${contactName},</p>
        <h1 style="font-weight:normal;font-size:28px;margin:0 0 8px">${wedding.couple}</h1>
        <p style="margin:0 0 24px">${wedding.dateLabel} · ${wedding.timeLabel}<br>${wedding.venue}</p>
        <p>Les escribimos para recordarles, con mucho cariño, que aún no tenemos la confirmación de asistencia de: <strong>${pendingNames.join(", ")}</strong>.</p>
        <p>Necesitamos su respuesta antes del <strong>${wedding.rsvpDeadlineLabel}</strong>. También pueden confirmar llamando al ${wedding.rsvpPhone}.</p>
        ${button(url, "Confirmar asistencia")}`),
  };
}

export type EmailPayload = ReturnType<typeof buildInvitationEmail>;

export const sendInvitationEmail = (to: string, contactName: string, code: string, guestCount: number) =>
  resend().emails.send(buildInvitationEmail(to, contactName, code, guestCount));

export const sendReminderEmail = (to: string, contactName: string, code: string, pendingNames: string[]) =>
  resend().emails.send(buildReminderEmail(to, contactName, code, pendingNames));

// Envío en lote (una sola petición a Resend por cada 50 correos).
export const sendEmailBatch = (payloads: EmailPayload[]) => resend().batch.send(payloads);

export async function sendConfirmationEmail(to: string, contactName: string, confirmed: string[], declined: string[]) {
  return resend().emails.send({
    from: from(),
    to,
    subject: `Recibimos su confirmación — ${wedding.couple}`,
    html: shell(`
        <p>Hola ${contactName}, ¡gracias por responder!</p>
        ${confirmed.length ? `<p>Nos acompañan: <strong>${confirmed.join(", ")}</strong></p>` : ""}
        ${declined.length ? `<p>No podrán asistir: ${declined.join(", ")}</p>` : ""}
        <p>${wedding.dateLabel} · ${wedding.timeLabel}<br>${wedding.venue}<br><a href="${wedding.mapsUrl}">Cómo llegar</a></p>
        <p>Pueden cambiar su respuesta en cualquier momento desde el mismo enlace de la invitación.</p>`),
  });
}
