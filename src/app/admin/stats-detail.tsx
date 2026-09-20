import type { Guest, Invitation } from "@/db/schema";
import { linkClass } from "./button-styles";

type Group = Invitation & { guests: Guest[] };
type Row = { guest: Guest; inv: Group };

export type DetailKey = "confirmados" | "no-asisten" | "sin-responder" | "grupos";
export const isDetailKey = (v: string | undefined): v is DetailKey =>
  v === "confirmados" || v === "no-asisten" || v === "sin-responder" || v === "grupos";

// Fecha y hora en hora de Costa Rica (el servidor de Vercel corre en UTC).
export const when = (d: Date | null | undefined) =>
  d ? d.toLocaleString("es-CR", { timeZone: "America/Costa_Rica", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }) : "—";

function ago(d: Date) {
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  return days <= 0 ? "hoy" : days === 1 ? "hace 1 día" : `hace ${days} días`;
}

const answeredAt = ({ guest, inv }: Row) => guest.respondedAt ?? inv.respondedAt;
const time = (d: Date | null | undefined) => d?.getTime() ?? 0;
const firstSent = (inv: Group) => [inv.sentEmailAt, inv.sentWhatsappAt].filter((d): d is Date => !!d).sort((a, b) => a.getTime() - b.getTime())[0] ?? null;

function GroupLink({ inv }: { inv: Group }) {
  return <a href={`/admin/grupo/${inv.id}`} className={linkClass}>{inv.groupKey} · {inv.contactName}</a>;
}

function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-left text-neutral-600">
          <tr>{head.map((h) => <th key={h} className="py-2 pr-4 font-medium">{h}</th>)}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
const td = "py-2 pr-4 align-top";

export function StatsDetail({ list, ver }: { list: Group[]; ver: DetailKey }) {
  const rows: Row[] = list.flatMap((inv) => inv.guests.map((guest) => ({ guest, inv })));
  let title: string;
  let summary: string | null = null;
  let body: React.ReactNode;

  if (ver === "confirmados" || ver === "no-asisten") {
    const status = ver === "confirmados" ? "confirmed" : "declined";
    const mine = rows.filter((r) => r.guest.status === status).sort((a, b) => time(answeredAt(b)) - time(answeredAt(a)));
    title = `${ver === "confirmados" ? "Confirmados" : "No asisten"} (${mine.length})`;
    summary = "Ordenados del más reciente al más antiguo.";
    body = mine.length === 0 ? (
      <p className="text-sm text-neutral-500">{ver === "confirmados" ? "Nadie ha confirmado todavía." : "Nadie ha indicado que no asiste."}</p>
    ) : (
      <Table head={["Invitado", "Grupo", ver === "confirmados" ? "Confirmó (fecha y hora)" : "Indicó que no asiste (fecha y hora)", ...(ver === "confirmados" ? ["Alergias / dieta"] : [])]}>
        {mine.map((r) => (
          <tr key={r.guest.id} className="border-t border-neutral-200">
            <td className="py-2 pr-4 align-top font-medium">{r.guest.name}</td>
            <td className={td}><GroupLink inv={r.inv} /></td>
            <td className={td}>{when(answeredAt(r))}</td>
            {ver === "confirmados" && <td className={td}>{r.guest.dietary ?? "—"}</td>}
          </tr>
        ))}
      </Table>
    );
  } else if (ver === "sin-responder") {
    const mine = rows.filter((r) => r.guest.status === "pending");
    const sent = mine.filter((r) => firstSent(r.inv)).sort((a, b) => time(firstSent(a.inv)) - time(firstSent(b.inv)));
    const unsent = mine.filter((r) => !firstSent(r.inv)).sort((a, b) => (a.inv.groupKey ?? "").localeCompare(b.inv.groupKey ?? ""));
    title = `Sin responder (${mine.length})`;
    summary = `${sent.length} en espera de respuesta (llevan más tiempo primero) · ${unsent.length} aún sin enviar.`;
    body = mine.length === 0 ? (
      <p className="text-sm text-neutral-500">Todos han respondido.</p>
    ) : (
      <Table head={["Invitado", "Grupo", "Correo enviado", "WhatsApp enviado", "Estado"]}>
        {[...sent, ...unsent].map((r) => {
          const first = firstSent(r.inv);
          return (
            <tr key={r.guest.id} className="border-t border-neutral-200">
              <td className="py-2 pr-4 align-top font-medium">{r.guest.name}</td>
              <td className={td}><GroupLink inv={r.inv} /></td>
              <td className={td}>{when(r.inv.sentEmailAt)}</td>
              <td className={td}>{when(r.inv.sentWhatsappAt)}</td>
              <td className={td}>
                {first
                  ? <span className="text-amber-800">Esperando confirmación desde {ago(first)}</span>
                  : <span className="text-neutral-500">Aún no se ha enviado</span>}
              </td>
            </tr>
          );
        })}
      </Table>
    );
  } else {
    const answered = list.filter((i) => i.respondedAt).sort((a, b) => time(b.respondedAt) - time(a.respondedAt));
    title = `Grupos que respondieron (${answered.length} de ${list.length})`;
    summary = `Faltan ${list.length - answered.length} grupos por responder. Ordenados del más reciente al más antiguo.`;
    body = answered.length === 0 ? (
      <p className="text-sm text-neutral-500">Ningún grupo ha respondido todavía.</p>
    ) : (
      <Table head={["Grupo", "Respondió (fecha y hora)", "Invitados"]}>
        {answered.map((inv) => (
          <tr key={inv.id} className="border-t border-neutral-200">
            <td className="py-2 pr-4 align-top font-medium"><GroupLink inv={inv} /></td>
            <td className={td}>{when(inv.respondedAt)}</td>
            <td className={td}>
              {[...inv.guests].sort((a, b) => a.id - b.id).map((g) => (
                <div key={g.id}>
                  {g.status === "confirmed" && <span className="text-green-700">✓ </span>}
                  {g.status === "declined" && <span className="text-red-700">✗ </span>}
                  {g.status === "pending" && <span className="text-neutral-400">· </span>}
                  <span className={g.status === "declined" ? "text-neutral-500 line-through" : ""}>{g.name}</span>
                  {g.status === "pending" && <span className="text-xs text-neutral-500"> (sin responder)</span>}
                </div>
              ))}
            </td>
          </tr>
        ))}
      </Table>
    );
  }

  return (
    <section id="detalle" className="mt-6 scroll-mt-4 rounded border border-neutral-300 bg-white p-4">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-lg">{title}</h2>
        <a href="/admin" className={`${linkClass} text-sm`}>Cerrar</a>
      </div>
      {summary && <p className="mt-1 mb-3 text-xs text-neutral-500">{summary}</p>}
      {body}
    </section>
  );
}
