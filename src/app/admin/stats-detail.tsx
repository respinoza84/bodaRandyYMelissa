import type { Guest } from "@/db/schema";
import { wedding } from "@/config/wedding";
import { whatsappLink, whatsappReminderLink } from "@/lib/whatsapp";
import { daysToDeadline, firstSent, isUnsent, needsReminder, pendingGuests, recentlyReminded, type Group } from "@/lib/outreach";
import { buttonClass, linkClass } from "./button-styles";
import { markReminderSentAction, markWhatsappSentAction, sendBulkEmailsAction, sendEmailAction, sendReminderEmailAction } from "./actions";
import { ActionForm } from "./toast";
import { SubmitButton } from "./submit-button";

type Row = { guest: Guest; inv: Group };

export type DetailKey = "confirmados" | "no-asisten" | "sin-responder" | "grupos" | "sin-enviar" | "recordatorios";
export const isDetailKey = (v: string | undefined): v is DetailKey =>
  v === "confirmados" || v === "no-asisten" || v === "sin-responder" || v === "grupos" || v === "sin-enviar" || v === "recordatorios";

// Fecha y hora en hora de Costa Rica (el servidor de Vercel corre en UTC).
export const when = (d: Date | null | undefined) =>
  d ? d.toLocaleString("es-CR", { timeZone: "America/Costa_Rica", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }) : "—";

// Días calendario transcurridos en hora de Costa Rica (UTC-6, sin cambio de horario): un envío de ayer en la noche es "hace 1 día", no "hoy".
const crDay = (d: Date) => Math.floor((d.getTime() - 6 * 3_600_000) / 86_400_000);
function ago(d: Date) {
  const days = crDay(new Date()) - crDay(d);
  return days <= 0 ? "hoy" : days === 1 ? "hace 1 día" : `hace ${days} días`;
}

const answeredAt = ({ guest, inv }: Row) => guest.respondedAt ?? inv.respondedAt;
const time = (d: Date | null | undefined) => d?.getTime() ?? 0;

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
      <Table head={["Invitado", "Grupo", ver === "confirmados" ? "Confirmó (fecha y hora)" : "Indicó que no asiste (fecha y hora)"]}>
        {mine.map((r) => (
          <tr key={r.guest.id} className="border-t border-neutral-200">
            <td className="py-2 pr-4 align-top font-medium">{r.guest.name}</td>
            <td className={td}><GroupLink inv={r.inv} /></td>
            <td className={td}>{when(answeredAt(r))}</td>
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
  } else if (ver === "sin-enviar") {
    const unsent = list.filter(isUnsent).sort((a, b) => (a.groupKey ?? "").localeCompare(b.groupKey ?? ""));
    const withEmail = unsent.filter((g) => g.email);
    const noContact = unsent.filter((g) => !g.email && !g.phone);
    title = `Sin enviar (${unsent.length} grupos)`;
    summary = `${withEmail.length} tienen correo · ${unsent.filter((g) => g.phone).length} tienen teléfono · ${noContact.length} sin ningún contacto (avisar en persona).`;
    body = unsent.length === 0 ? (
      <p className="text-sm text-neutral-500">A todos los grupos ya se les envió la invitación.</p>
    ) : (
      <>
        {withEmail.length > 0 && (
          <ActionForm action={sendBulkEmailsAction.bind(null, "invitation")} className="mb-4">
            <SubmitButton variant="primary" size="md" pendingLabel="Enviando…"
              confirm={`¿Enviar la invitación por correo a ${withEmail.length} grupos? Se enviarán correos reales.`}>
              Enviar invitación por correo a los {withEmail.length} con correo
            </SubmitButton>
          </ActionForm>
        )}
        <Table head={["Grupo", "Invitados", "Correo", "Teléfono", "Enviar"]}>
          {unsent.map((inv) => (
            <tr key={inv.id} className="border-t border-neutral-200">
              <td className="py-2 pr-4 align-top font-medium"><GroupLink inv={inv} /></td>
              <td className={td}>{inv.guests.map((g) => <div key={g.id}>{g.name}</div>)}</td>
              <td className={td}>{inv.email ?? "—"}</td>
              <td className={td}>{inv.phone ?? "—"}</td>
              <td className={td}>
                <div className="flex flex-wrap items-start gap-2">
                  {inv.email && (
                    <ActionForm action={sendEmailAction.bind(null, inv.id)}>
                      <SubmitButton variant="primary" pendingLabel="Enviando…">Enviar correo</SubmitButton>
                    </ActionForm>
                  )}
                  {inv.phone && (
                    <div>
                      <a href={whatsappLink(inv.phone, inv.contactName, inv.code, inv.guests.length)} target="_blank" rel="noreferrer" className={buttonClass("secondary")}>Abrir WhatsApp</a>
                      <ActionForm action={markWhatsappSentAction.bind(null, inv.id)} className="mt-1">
                        <SubmitButton asLink pendingLabel="Guardando…" className="text-xs">marcar enviado</SubmitButton>
                      </ActionForm>
                    </div>
                  )}
                  {!inv.email && !inv.phone && <span className="text-neutral-500">Sin contacto: avisar en persona</span>}
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </>
    );
  } else if (ver === "recordatorios") {
    const due = list.filter(needsReminder).sort((a, b) =>
      (a.reminderCount - b.reminderCount) || (time(firstSent(a)) - time(firstSent(b))));
    const eligible = due.filter((g) => g.email && !recentlyReminded(g));
    const days = daysToDeadline(wedding.rsvpDeadline);
    const deadline = days > 0 ? `Faltan ${days} días para el ${wedding.rsvpDeadlineLabel}.` : days === 0 ? `Hoy vence el plazo (${wedding.rsvpDeadlineLabel}).` : `El plazo del ${wedding.rsvpDeadlineLabel} ya venció.`;
    title = `Por recordar (${due.length} grupos)`;
    summary = `${deadline} Primero los que nunca se han recordado y llevan más tiempo esperando.`;
    body = due.length === 0 ? (
      <p className="text-sm text-neutral-500">No hay grupos por recordar: todos respondieron o aún no se les envía la invitación.</p>
    ) : (
      <>
        {eligible.length > 0 && (
          <ActionForm action={sendBulkEmailsAction.bind(null, "reminder")} className="mb-4">
            <SubmitButton variant="primary" size="md" pendingLabel="Enviando…"
              confirm={`¿Enviar el recordatorio por correo a ${eligible.length} grupos? Se enviarán correos reales.`}>
              Enviar recordatorio por correo a los {eligible.length} con correo
            </SubmitButton>
          </ActionForm>
        )}
        <Table head={["Grupo", "Falta responder", "Invitación enviada", "Último recordatorio", "Recordar"]}>
          {due.map((inv) => {
            const first = firstSent(inv);
            const pending = pendingGuests(inv);
            return (
              <tr key={inv.id} className="border-t border-neutral-200">
                <td className="py-2 pr-4 align-top font-medium"><GroupLink inv={inv} /></td>
                <td className={td}>{pending.map((g) => <div key={g.id}>{g.name}</div>)}</td>
                <td className={td}>{when(first)}{first && <div className="text-xs text-neutral-500">{ago(first)}</div>}</td>
                <td className={td}>
                  {inv.remindedAt ? <>{when(inv.remindedAt)}<div className="text-xs text-neutral-500">{inv.reminderCount} {inv.reminderCount === 1 ? "vez" : "veces"}</div></> : <span className="text-neutral-500">Nunca</span>}
                </td>
                <td className={td}>
                  <div className="flex flex-wrap items-start gap-2">
                    {inv.email && (
                      <ActionForm action={sendReminderEmailAction.bind(null, inv.id)}>
                        <SubmitButton variant={inv.remindedAt ? "secondary" : "primary"} pendingLabel="Enviando…">Recordar por correo</SubmitButton>
                      </ActionForm>
                    )}
                    {inv.phone && (
                      <div>
                        <a href={whatsappReminderLink(inv.phone, inv.contactName, inv.code, pending.length)} target="_blank" rel="noreferrer" className={buttonClass("secondary")}>Recordar por WhatsApp</a>
                        <ActionForm action={markReminderSentAction.bind(null, inv.id)} className="mt-1">
                          <SubmitButton asLink pendingLabel="Guardando…" className="text-xs">marcar recordado</SubmitButton>
                        </ActionForm>
                      </div>
                    )}
                    {!inv.email && !inv.phone && <span className="text-neutral-500">Sin contacto: avisar en persona</span>}
                  </div>
                </td>
              </tr>
            );
          })}
        </Table>
      </>
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
