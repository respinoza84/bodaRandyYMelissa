import { notFound } from "next/navigation";
import { db } from "@/db";
import { invitations } from "@/db/schema";
import { eq, isNull, and } from "drizzle-orm";
import { wedding } from "@/config/wedding";
import { Hero } from "@/components/hero";
import { Invitation } from "@/components/invitation";
import { RsvpForm } from "./rsvp-form";

export const dynamic = "force-dynamic";

export default async function InvitationPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const inv = await db.query.invitations.findFirst({ where: eq(invitations.code, code), with: { guests: true } });
  if (!inv) notFound();

  db.update(invitations).set({ viewedAt: new Date() })
    .where(and(eq(invitations.id, inv.id), isNull(invitations.viewedAt))).catch(() => {});

  const answered = inv.guests.some((g) => g.status !== "pending");

  return (
    <main>
      <Hero />
      <Invitation>
        <p className="font-light">Hola {inv.contactName},</p>
        <h2 className="mt-1 text-2xl">{answered ? "Su respuesta" : "Confirmen su asistencia"}</h2>
        <p className="mt-1 text-sm font-light text-cream/80">
          {answered ? "Ya la recibimos. Pueden cambiarla aquí mismo si algo cambia."
            : `Necesitamos su respuesta antes del ${wedding.rsvpDeadlineLabel}.`}
        </p>
        <RsvpForm code={code} guestList={inv.guests} phone={inv.phone} />
      </Invitation>
    </main>
  );
}
