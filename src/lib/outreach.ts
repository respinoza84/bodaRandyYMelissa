import type { Guest, Invitation } from "@/db/schema";

export type Group = Invitation & { guests: Guest[] };

export const pendingGuests = (g: Group) => g.guests.filter((x) => x.status === "pending");
export const wasSent = (g: Group) => !!(g.sentEmailAt || g.sentWhatsappAt);
export const firstSent = (g: Group) =>
  [g.sentEmailAt, g.sentWhatsappAt].filter((d): d is Date => !!d).sort((a, b) => a.getTime() - b.getTime())[0] ?? null;

export const hasAnswered = (g: Group) => !!g.respondedAt || g.guests.some((x) => x.status !== "pending");
// La invitación le llegó: se registró un envío, o ya abrió el enlace o respondió (aunque nadie lo marcara como enviado,
// p. ej. porque el enlace se mandó por WhatsApp a mano).
export const reachedInvite = (g: Group) => wasSent(g) || !!g.viewedAt || hasAnswered(g);
// Primera evidencia de que le llegó: la fecha de envío o, si no hay registro, cuándo abrió el enlace.
export const firstContact = (g: Group) => firstSent(g) ?? g.viewedAt ?? g.respondedAt ?? null;

// Sin ninguna señal de que le haya llegado la invitación.
export const isUnsent = (g: Group) => !reachedInvite(g);
// La invitación le llegó y todavía hay personas sin responder.
export const needsReminder = (g: Group) => reachedInvite(g) && pendingGuests(g).length > 0;

export const daysToDeadline = (deadline: Date) => Math.ceil((deadline.getTime() - Date.now()) / 86_400_000);

// No se vuelve a recordar a un grupo antes de este tiempo (evita envíos repetidos en lote).
export const REMINDER_COOLDOWN_MS = 12 * 60 * 60_000;
export const recentlyReminded = (g: Group) => !!g.remindedAt && Date.now() - g.remindedAt.getTime() < REMINDER_COOLDOWN_MS;
