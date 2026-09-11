// Carga data/invitados.csv en la base. Idempotente por grupo: si el grupo ya existe, lo salta.
// Uso: npm run db:seed
import "dotenv/config";
import { readFileSync } from "node:fs";
import { parse } from "csv-parse/sync";
import { randomBytes } from "node:crypto";
import { db } from "../src/db";
import { invitations, guests } from "../src/db/schema";
import { eq } from "drizzle-orm";

type Row = { grupo: string; contacto: string; email: string; telefono: string; invitado: string };
const rows = parse(readFileSync("data/invitados.csv"), { columns: true, skip_empty_lines: true, trim: true }) as Row[];

const groups = new Map<string, Row[]>();
for (const r of rows) groups.set(r.grupo, [...(groups.get(r.grupo) ?? []), r]);

const code = () => randomBytes(6).toString("base64url"); // 8 chars, no adivinable

for (const [key, members] of groups) {
  const exists = await db.query.invitations.findFirst({ where: eq(invitations.groupKey, key) });
  if (exists) { console.log(`skip ${key}`); continue; }
  const head = members[0];
  const [inv] = await db.insert(invitations).values({
    code: code(), groupKey: key, contactName: head.contacto,
    email: head.email || null, phone: head.telefono.replace(/\D/g, "") || null,
  }).returning();
  await db.insert(guests).values(members.map((m) => ({ invitationId: inv.id, name: m.invitado })));
  console.log(`${key} → ${members.length} invitados → /invitacion/${inv.code}`);
}
console.log("done");
