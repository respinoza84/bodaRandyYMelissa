import { wedding } from "@/config/wedding";

export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || wedding.siteUrl).replace(/\/$/, "");

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
