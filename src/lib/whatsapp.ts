import { wedding } from "@/config/wedding";

// Solo se usa el origen (https://dominio). Si NEXT_PUBLIC_SITE_URL trae una ruta por error (p. ej. /admin/login)
// o no trae https://, se corrige; si es inválida, se usa el dominio oficial de wedding.ts.
function resolveSiteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) {
    try { return new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`).origin; } catch { /* inválida */ }
  }
  return wedding.siteUrl;
}
export const siteUrl = resolveSiteUrl();

export function invitationUrl(code: string) {
  return `${siteUrl}/invitacion/${code}`;
}

// Enlace "click to chat": abre WhatsApp con el mensaje listo. Sin API ni aprobaciones.
export function whatsappLink(phone: string | null, contactName: string, code: string, guestCount: number) {
  const plural = guestCount > 1;
  const text = plural
    ? `¡Hola ${contactName}! Somos ${wedding.couple} 💍\n` +
      `Nos casamos el ${wedding.dateLabel} y queremos que estén con nosotros.\n` +
      `Hemos reservado ${guestCount} espacios para ustedes. Por favor confirmen todos en el enlace.\n` +
      `Aquí está su invitación y la confirmación de asistencia:\n${invitationUrl(code)}\n` +
      `Por favor confirmen antes del ${wedding.rsvpDeadlineLabel}. ¡Gracias!`
    : `¡Hola ${contactName}! Somos ${wedding.couple} 💍\n` +
      `Nos casamos el ${wedding.dateLabel} y queremos que estés con nosotros.\n` +
      `Hemos reservado 1 espacio para ti. Por favor confirma tu asistencia en el enlace.\n` +
      `Aquí está tu invitación y la confirmación de asistencia:\n${invitationUrl(code)}\n` +
      `Por favor confirma antes del ${wedding.rsvpDeadlineLabel}. ¡Gracias!`;
  const base = phone ? `https://wa.me/${phone.replace(/\D/g, "")}` : "https://wa.me/";
  return `${base}?text=${encodeURIComponent(text)}`;
}

// Recordatorio para quienes aún no confirman. `pendingCount` = personas de la invitación que faltan por responder.
export function whatsappReminderLink(phone: string | null, contactName: string, code: string, pendingCount: number) {
  const plural = pendingCount > 1;
  const text = plural
    ? `¡Hola ${contactName}! Somos ${wedding.couple} 💍\n` +
      `Les escribimos para recordarles que aún nos falta la confirmación de ${pendingCount} personas de su invitación.\n` +
      `Pueden confirmar aquí:\n${invitationUrl(code)}\n` +
      `Necesitamos su respuesta antes del ${wedding.rsvpDeadlineLabel}. ¡Gracias!`
    : `¡Hola ${contactName}! Somos ${wedding.couple} 💍\n` +
      `Te escribimos para recordarte que aún no tenemos tu confirmación de asistencia.\n` +
      `Puedes confirmar aquí:\n${invitationUrl(code)}\n` +
      `Necesitamos tu respuesta antes del ${wedding.rsvpDeadlineLabel}. ¡Gracias!`;
  const base = phone ? `https://wa.me/${phone.replace(/\D/g, "")}` : "https://wa.me/";
  return `${base}?text=${encodeURIComponent(text)}`;
}
