"use server";

import { db } from "@/db";
import { guests, invitations } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { normalizePhone } from "@/lib/phone";
import type { ActionResult } from "./toast";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAdmin, logoutAdmin } from "@/lib/auth";
import { buildInvitationEmail, buildReminderEmail, sendEmailBatch, sendInvitationEmail, sendReminderEmail, type EmailPayload } from "@/lib/email";
import { isUnsent, needsReminder, pendingGuests, recentlyReminded, type Group } from "@/lib/outreach";

async function guard() { if (!(await isAdmin())) throw new Error("No autorizado"); }

export async function sendEmailAction(invitationId: number): Promise<ActionResult> {
  await guard();
  const inv = await db.query.invitations.findFirst({ where: eq(invitations.id, invitationId), with: { guests: true } });
  if (!inv) return { ok: false, message: "El grupo ya no existe." };
  if (!inv.email) return { ok: false, message: "Este grupo no tiene correo." };
  // Protección contra doble clic o varias pestañas: si se envió hace segundos, no se repite.
  if (inv.sentEmailAt && Date.now() - inv.sentEmailAt.getTime() < 15_000) {
    return { ok: true, message: `Ya se envió a ${inv.email} hace un momento.` };
  }
  if (!process.env.RESEND_API_KEY) return { ok: false, message: "Falta configurar RESEND_API_KEY en Vercel." };

  try {
    const res = await sendInvitationEmail(inv.email, inv.contactName, inv.code, inv.guests.length);
    if (res.error) return { ok: false, message: `No se pudo enviar a ${inv.email}: ${res.error.message}` };
  } catch (e) {
    console.error(e);
    return { ok: false, message: `No se pudo enviar a ${inv.email}. Intentá de nuevo.` };
  }
  await db.update(invitations).set({ sentEmailAt: new Date() }).where(eq(invitations.id, invitationId));
  revalidatePath("/admin");
  return { ok: true, message: `Correo ${inv.sentEmailAt ? "reenviado" : "enviado"} a ${inv.email}.` };
}

// --- Recordatorios ---

const RECENT_MS = 15_000;

export async function sendReminderEmailAction(invitationId: number): Promise<ActionResult> {
  await guard();
  const inv = await db.query.invitations.findFirst({ where: eq(invitations.id, invitationId), with: { guests: true } });
  if (!inv) return { ok: false, message: "El grupo ya no existe." };
  if (!inv.email) return { ok: false, message: "Este grupo no tiene correo." };
  const pending = pendingGuests(inv);
  if (!pending.length) return { ok: false, message: "Todos en este grupo ya respondieron." };
  // Protección contra doble clic o varias pestañas.
  if (inv.remindedAt && Date.now() - inv.remindedAt.getTime() < RECENT_MS) {
    return { ok: true, message: `Ya se envió un recordatorio a ${inv.email} hace un momento.` };
  }
  if (!process.env.RESEND_API_KEY) return { ok: false, message: "Falta configurar RESEND_API_KEY en Vercel." };

  try {
    const res = await sendReminderEmail(inv.email, inv.contactName, inv.code, pending.map((g) => g.name));
    if (res.error) return { ok: false, message: `No se pudo enviar a ${inv.email}: ${res.error.message}` };
  } catch (e) {
    console.error(e);
    return { ok: false, message: `No se pudo enviar a ${inv.email}. Intentá de nuevo.` };
  }
  await db.update(invitations).set({ remindedAt: new Date(), reminderCount: sql`${invitations.reminderCount} + 1` }).where(eq(invitations.id, invitationId));
  revalidatePath("/admin");
  return { ok: true, message: `Recordatorio enviado a ${inv.email}.` };
}

// El recordatorio por WhatsApp se envía a mano desde el teléfono; esto solo lo deja registrado.
export async function markReminderSentAction(invitationId: number): Promise<ActionResult> {
  await guard();
  await db.update(invitations).set({ remindedAt: new Date(), reminderCount: sql`${invitations.reminderCount} + 1` }).where(eq(invitations.id, invitationId));
  revalidatePath("/admin");
  return { ok: true, message: "Recordatorio por WhatsApp registrado." };
}

// Envío en lote por correo. `kind`: invitación a quienes no la han recibido, o recordatorio a quienes no responden.
export async function sendBulkEmailsAction(kind: "invitation" | "reminder"): Promise<ActionResult> {
  await guard();
  if (!process.env.RESEND_API_KEY) return { ok: false, message: "Falta configurar RESEND_API_KEY en Vercel." };

  const all: Group[] = await db.query.invitations.findMany({ with: { guests: true } });
  const targets = all.filter((g) => g.email && (kind === "invitation" ? isUnsent(g) : needsReminder(g) && !recentlyReminded(g)));
  const skipped = kind === "reminder" ? all.filter((g) => g.email && needsReminder(g) && recentlyReminded(g)).length : 0;
  if (!targets.length) {
    return { ok: false, message: kind === "invitation" ? "No hay grupos con correo pendientes de invitación." : `No hay grupos por recordar${skipped ? ` (${skipped} ya se recordaron hace menos de 12 horas)` : ""}.` };
  }

  let sent = 0;
  for (let i = 0; i < targets.length; i += 50) {
    const chunk = targets.slice(i, i + 50);
    const payloads: EmailPayload[] = chunk.map((g) =>
      kind === "invitation"
        ? buildInvitationEmail(g.email!, g.contactName, g.code, g.guests.length)
        : buildReminderEmail(g.email!, g.contactName, g.code, pendingGuests(g).map((x) => x.name)));
    try {
      const res = await sendEmailBatch(payloads);
      if (res.error) throw new Error(res.error.message);
    } catch (e) {
      console.error(e);
      revalidatePath("/admin");
      return { ok: false, message: `Se enviaron ${sent} de ${targets.length}. Falló un lote: ${e instanceof Error ? e.message : "error desconocido"}.` };
    }
    const now = new Date();
    await Promise.all(chunk.map((g) => db.update(invitations).set(
      kind === "invitation"
        ? { sentEmailAt: now }
        : { remindedAt: now, reminderCount: sql`${invitations.reminderCount} + 1` },
    ).where(eq(invitations.id, g.id))));
    sent += chunk.length;
  }
  revalidatePath("/admin");
  const what = kind === "invitation" ? "invitaciones" : "recordatorios";
  return { ok: true, message: `Se enviaron ${sent} ${what} por correo${skipped ? ` (${skipped} omitidos: recordados hace menos de 12 horas)` : ""}.` };
}

export async function markWhatsappSentAction(invitationId: number): Promise<ActionResult> {
  await guard();
  await db.update(invitations).set({ sentWhatsappAt: new Date() }).where(eq(invitations.id, invitationId));
  revalidatePath("/admin");
  return { ok: true, message: "Marcado como enviado por WhatsApp." };
}

export async function updatePhoneAction(invitationId: number, formData: FormData): Promise<ActionResult> {
  await guard();
  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  await db.update(invitations).set({ phone }).where(eq(invitations.id, invitationId));
  revalidatePath("/admin");
  return { ok: true, message: phone ? `Teléfono guardado: ${phone}.` : "Teléfono borrado." };
}

export async function logoutAction() {
  await logoutAdmin();
  redirect("/admin/login");
}

// --- Grupos e invitados ---

const STATUSES = ["pending", "confirmed", "declined"] as const;
type Status = (typeof STATUSES)[number];
const parseNames = (text: string) => text.split("\n").map((n) => n.trim()).filter(Boolean);
const field = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

async function nextGroupKey() {
  const rows = await db.select({ k: invitations.groupKey }).from(invitations);
  const max = rows.reduce((m, r) => {
    const n = /^G(\d+)$/.exec(r.k ?? "");
    return n ? Math.max(m, Number(n[1])) : m;
  }, 0);
  return `G${String(max + 1).padStart(2, "0")}`;
}

export async function createGroupAction(formData: FormData) {
  await guard();
  const contactName = field(formData, "contactName");
  const names = parseNames(String(formData.get("guests") ?? ""));
  if (!contactName) redirect("/admin/grupo/nuevo?error=nombre");
  if (!names.length) redirect("/admin/grupo/nuevo?error=invitados");

  const [inv] = await db.insert(invitations).values({
    code: randomBytes(6).toString("base64url"),
    groupKey: await nextGroupKey(),
    contactName,
    email: field(formData, "email") || null,
    phone: normalizePhone(field(formData, "phone")),
  }).returning();
  await db.insert(guests).values(names.map((name) => ({ invitationId: inv.id, name })));
  revalidatePath("/admin");
  redirect(`/admin/grupo/${inv.id}?ok=creado`);
}

export async function updateGroupAction(invitationId: number, formData: FormData) {
  await guard();
  const inv = await db.query.invitations.findFirst({ where: eq(invitations.id, invitationId), with: { guests: true } });
  if (!inv) redirect("/admin");

  const back = (q: string) => `/admin/grupo/${invitationId}?${q}`;
  const contactName = field(formData, "contactName");
  if (!contactName) redirect(back("error=nombre"));

  const removed = inv.guests.filter((g) => formData.get(`remove-${g.id}`));
  const added = parseNames(String(formData.get("newGuests") ?? ""));
  if (inv.guests.length - removed.length + added.length < 1) redirect(back("error=invitados"));

  const now = new Date();
  await db.update(invitations).set({
    contactName, email: field(formData, "email") || null, phone: normalizePhone(field(formData, "phone")),
  }).where(eq(invitations.id, invitationId));

  const finalStatuses: Status[] = [];
  for (const g of inv.guests) {
    if (formData.get(`remove-${g.id}`)) { await db.delete(guests).where(eq(guests.id, g.id)); continue; }
    const raw = field(formData, `status-${g.id}`) as Status;
    const status = STATUSES.includes(raw) ? raw : g.status;
    finalStatuses.push(status);
    await db.update(guests).set({
      name: field(formData, `name-${g.id}`) || g.name,
      dietary: field(formData, `dietary-${g.id}`) || null,
      status,
      respondedAt: status === g.status ? g.respondedAt : status === "pending" ? null : now,
    }).where(eq(guests.id, g.id));
  }
  if (added.length) await db.insert(guests).values(added.map((name) => ({ invitationId, name })));

  const answered = finalStatuses.some((s) => s !== "pending");
  await db.update(invitations).set({ respondedAt: answered ? (inv.respondedAt ?? now) : null }).where(eq(invitations.id, invitationId));

  revalidatePath("/admin");
  redirect(back("ok=guardado"));
}

export async function deleteGroupAction(invitationId: number) {
  await guard();
  await db.delete(invitations).where(eq(invitations.id, invitationId)); // guests se borran en cascada
  revalidatePath("/admin");
  redirect("/admin?ok=eliminado");
}
