import { wedding } from "@/config/wedding";

export function invitationUrl(code: string) {
  return `${process.env.NEXT_PUBLIC_SITE_URL}/invitacion/${code}`;
}

// Enlace "click to chat": abre WhatsApp con el mensaje listo. Sin API ni aprobaciones.
export function whatsappLink(phone: string | null, contactName: string, code: string) {
  const text =
    `¡Hola ${contactName}! Somos ${wedding.couple} 💍\n` +
    `Nos casamos el ${wedding.dateLabel} y queremos que estés con nosotros.\n` +
    `Aquí está su invitación y la confirmación de asistencia:\n${invitationUrl(code)}\n` +
    `Por favor confirmen antes del ${wedding.rsvpDeadlineLabel}. ¡Gracias!`;
  const base = phone ? `https://wa.me/${phone.replace(/\D/g, "")}` : "https://wa.me/";
  return `${base}?text=${encodeURIComponent(text)}`;
}
