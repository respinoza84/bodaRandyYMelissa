import type { Guest, Invitation } from "@/db/schema";

export type Group = Invitation & { guests: Guest[] };

export const pendingGuests = (g: Group) => g.guests.filter((x) => x.status === "pending");
export const wasSent = (g: Group) => !!(g.sentEmailAt || g.sentWhatsappAt);
export const firstSent = (g: Group) =>
  [g.sentEmailAt, g.sentWhatsappAt].filter((d): d is Date => !!d).sort((a, b) => a.getTime() - b.getTime())[0] ?? null;

// Aún no se le ha enviado la invitación por ningún canal.
export const isUnsent = (g: Group) => !wasSent(g);
// Ya se le envió la invitación y todavía hay personas sin responder.
export const needsReminder = (g: Group) => wasSent(g) && pendingGuests(g).length > 0;

export const daysToDeadline = (deadline: Date) => Math.ceil((deadline.getTime() - Date.now()) / 86_400_000);

// No se vuelve a recordar a un grupo antes de este tiempo (evita envíos repetidos en lote).
export const REMINDER_COOLDOWN_MS = 12 * 60 * 60_000;
export const recentlyReminded = (g: Group) => !!g.remindedAt && Date.now() - g.remindedAt.getTime() < REMINDER_COOLDOWN_MS;
