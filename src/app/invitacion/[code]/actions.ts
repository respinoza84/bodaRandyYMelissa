"use server";

import { db } from "@/db";
import { guests, invitations } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { sendConfirmationEmail } from "@/lib/email";
import { normalizePhone } from "@/lib/phone";

export type RsvpState = { ok: boolean; message: string };

export async function submitRsvp(code: string, _prev: RsvpState, formData: FormData): Promise<RsvpState> {
  const inv = await db.query.invitations.findFirst({
    where: eq(invitations.code, code),
    with: { guests: true },
  });
  if (!inv) return { ok: false, message: "Esta invitación no existe." };

  const ids = inv.guests.map((g) => g.id);
  const now = new Date();
  const confirmed: string[] = [];
  const declined: string[] = [];

  for (const g of inv.guests) {
    const status = formData.get(`status-${g.id}`);
    if (status !== "confirmed" && status !== "declined") continue;
    const dietary = String(formData.get(`dietary-${g.id}`) ?? "").trim() || null;
    await db.update(guests).set({ status, dietary, respondedAt: now }).where(eq(guests.id, g.id));
    (status === "confirmed" ? confirmed : declined).push(g.name);
  }
  if (!confirmed.length && !declined.length) {
    return { ok: false, message: "Marca al menos una persona antes de enviar." };
  }

  const notes = String(formData.get("notes") ?? "").trim() || null;
  const phone = normalizePhone(String(formData.get("phone") ?? "")) ?? inv.phone;
  await db.update(invitations).set({ respondedAt: now, notes, phone }).where(eq(invitations.id, inv.id));

  if (inv.email && process.env.RESEND_API_KEY) {
    try { await sendConfirmationEmail(inv.email, inv.contactName, confirmed, declined); } catch (e) { console.error(e); }
  }
  revalidatePath(`/invitacion/${code}`);
  revalidatePath("/admin");
  void ids;
  return { ok: true, message: "¡Listo! Recibimos su respuesta." };
}
