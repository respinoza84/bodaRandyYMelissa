import { db } from "@/db";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) return new Response("No autorizado", { status: 401 });
  const list = await db.query.invitations.findMany({ with: { guests: true } });
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const rows = [["grupo", "contacto", "email", "telefono", "invitado", "estado", "dieta", "respondio", "notas"].join(",")];
  for (const inv of list) for (const g of inv.guests) {
    rows.push([inv.groupKey, inv.contactName, inv.email, inv.phone, g.name, g.status, g.dietary, inv.respondedAt?.toISOString(), inv.notes].map(esc).join(","));
  }
  return new Response("\uFEFF" + rows.join("\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="invitados.csv"' },
  });
}
