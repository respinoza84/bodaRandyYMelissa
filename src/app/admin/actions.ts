"use server";

import { db } from "@/db";
import { invitations } from "@/db/schema";
import { eq } from "drizzle-orm";
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
  const phone = String(formData.get("phone") ?? "").replace(/\D/g, "") || null;
  await db.update(invitations).set({ phone }).where(eq(invitations.id, invitationId));
  revalidatePath("/admin");
}

export async function logoutAction() {
  await logoutAdmin();
  redirect("/admin/login");
}
