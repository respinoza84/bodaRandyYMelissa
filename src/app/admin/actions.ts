"use server";

import { db } from "@/db";
import { guests, invitations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { normalizePhone } from "@/lib/phone";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAdmin, logoutAdmin } from "@/lib/auth";
import { sendInvitationEmail } from "@/lib/email";

async function guard() { if (!(await isAdmin())) throw new Error("No autorizado"); }

export async function sendEmailAction(invitationId: number) {
  await guard();
  const inv = await db.query.invitations.findFirst({ where: eq(invitations.id, invitationId), with: { guests: true } });
  if (!inv?.email) return;
  await sendInvitationEmail(inv.email, inv.contactName, inv.code, inv.guests.length);
  await db.update(invitations).set({ sentEmailAt: new Date() }).where(eq(invitations.id, invitationId));
  revalidatePath("/admin");
}

export async function markWhatsappSentAction(invitationId: number) {
  await guard();
  await db.update(invitations).set({ sentWhatsappAt: new Date() }).where(eq(invitations.id, invitationId));
  revalidatePath("/admin");
}

export async function updatePhoneAction(invitationId: number, formData: FormData) {
  await guard();
  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  await db.update(invitations).set({ phone }).where(eq(invitations.id, invitationId));
  revalidatePath("/admin");
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
