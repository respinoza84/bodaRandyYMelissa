import { redirect } from "next/navigation";
import { db } from "@/db";
import { isAdmin } from "@/lib/auth";
import { whatsappLink, invitationUrl } from "@/lib/whatsapp";
import { logoutAction, markWhatsappSentAction, sendEmailAction, updatePhoneAction } from "./actions";
import { ActionForm, FlashToast } from "./toast";
import { SubmitButton } from "./submit-button";
import { buttonClass, linkClass } from "./button-styles";
import { StatsDetail, isDetailKey, type DetailKey } from "./stats-detail";

export const dynamic = "force-dynamic";

function fmt(d: Date | null) { return d ? d.toLocaleDateString("es-CR", { timeZone: "America/Costa_Rica", day: "2-digit", month: "short" }) : "—"; }

// Minúsculas y sin tildes, para que "jose" encuentre "José".
const norm = (v: string | null | undefined) => (v ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const RESP_FILTERS = [
  ["", "Todas las respuestas"], ["sin-responder", "Sin responder"], ["respondieron", "Ya respondieron"], ["incompleto", "Respuesta incompleta"],
] as const;
const SEND_FILTERS = [["", "Todos los envíos"], ["sin-enviar", "Sin enviar"], ["enviado", "Ya enviados"]] as const;

type Search = { q?: string; resp?: string; envio?: string; ok?: string; ver?: string };

export default async function AdminPage({ searchParams }: { searchParams: Promise<Search> }) {
  if (!(await isAdmin())) redirect("/admin/login");
  const { q = "", resp = "", envio = "", ok, ver } = await searchParams;
  const detail: DetailKey | null = isDetailKey(ver) ? ver : null;

  const list = await db.query.invitations.findMany({ with: { guests: true }, orderBy: (t, { asc }) => asc(t.groupKey) });
  const needle = norm(q.trim());
  const shown = list.filter((inv) => {
    const pending = inv.guests.filter((g) => g.status === "pending").length;
    const sent = !!(inv.sentEmailAt || inv.sentWhatsappAt);
    if (needle) {
      const hay = norm([inv.groupKey, inv.contactName, inv.email, inv.phone, ...inv.guests.map((g) => g.name)].join(" "));
      if (!hay.includes(needle)) return false;
    }
    if (resp === "sin-responder" && pending !== inv.guests.length) return false;
    if (resp === "respondieron" && pending === inv.guests.length) return false;
    if (resp === "incompleto" && !(pending > 0 && pending < inv.guests.length)) return false;
    if (envio === "sin-enviar" && sent) return false;
    if (envio === "enviado" && !sent) return false;
    return true;
  });
  const all = list.flatMap((i) => i.guests);
  const stats = {
    total: all.length,
    confirmed: all.filter((g) => g.status === "confirmed").length,
    declined: all.filter((g) => g.status === "declined").length,
    pending: all.filter((g) => g.status === "pending").length,
    groupsAnswered: list.filter((i) => i.respondedAt).length,
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="flex items-baseline justify-between">
        <h1 className="text-2xl">Invitados</h1>
        <div className="flex items-center gap-2">
          <a href="/admin/grupo/nuevo" className={buttonClass("primary")}>+ Nuevo grupo</a>
          <a href="/admin/export" className={buttonClass("secondary")}>Exportar CSV</a>
          <form action={logoutAction}><SubmitButton pendingLabel="Saliendo…">Salir</SubmitButton></form>
        </div>
      </header>

      <nav aria-label="Resumen" className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
        {([
          ["Invitados", stats.total, null],
          ["Confirmados", stats.confirmed, "confirmados"],
          ["No asisten", stats.declined, "no-asisten"],
          ["Sin responder", stats.pending, "sin-responder"],
          ["Grupos respondieron", `${stats.groupsAnswered}/${list.length}`, "grupos"],
        ] as [string, string | number, DetailKey | null][]).map(([label, value, key]) => {
          const inner = (
            <>
              <span className="block text-sm text-neutral-600">{label}</span>
              <span className="block text-2xl">{value}</span>
              {key && <span className="mt-1 block text-xs text-neutral-500 underline underline-offset-2">{detail === key ? "Ocultar detalle" : "Ver detalle"}</span>}
            </>
          );
          if (!key) return <div key={label} className="rounded border border-neutral-300 p-3">{inner}</div>;
          const active = detail === key;
          return (
            <a key={label} href={active ? "/admin" : `/admin?ver=${key}#detalle`} aria-current={active ? "true" : undefined}
              className={`block rounded border p-3 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 ${
                active ? "border-neutral-900 bg-white" : "border-neutral-300 hover:border-neutral-500 hover:bg-white/60 active:bg-white"}`}>
              {inner}
            </a>
          );
        })}
      </nav>
      {detail && <StatsDetail list={list} ver={detail} />}

      <FlashToast message={ok === "eliminado" ? "Grupo eliminado." : undefined} />

      <form method="GET" className="mt-8 flex flex-wrap items-center gap-2 text-sm">
        <input name="q" defaultValue={q} placeholder="Buscar nombre, contacto, correo, teléfono o grupo" type="search"
          className="min-w-64 flex-1 rounded border border-neutral-300 px-3 py-2" />
        <select name="resp" defaultValue={resp} className="rounded border border-neutral-300 px-2 py-2">
          {RESP_FILTERS.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
        </select>
        <select name="envio" defaultValue={envio} className="rounded border border-neutral-300 px-2 py-2">
          {SEND_FILTERS.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
        </select>
        <button className={buttonClass("primary", "md")}>Filtrar</button>
        {(q || resp || envio) && <a href="/admin" className={linkClass}>Limpiar</a>}
      </form>
      <p className="mt-2 text-xs text-neutral-500">Mostrando {shown.length} de {list.length} grupos</p>

      <div className="overflow-x-auto">
      <table className="mt-4 w-full text-sm">
        <thead className="text-left text-neutral-600">
          <tr>
            <th className="py-2">Grupo</th><th>Invitados</th><th>Contacto</th><th>Teléfono</th>
            <th>Correo</th><th>WhatsApp</th><th>Visto</th><th>Respondió</th>
          </tr>
        </thead>
        <tbody>
          {shown.map((inv) => (
            <tr key={inv.id} className="border-t border-neutral-200 align-top">
              <td className="py-3 pr-2">
                <div>{inv.groupKey}</div>
                <a href={invitationUrl(inv.code)} target="_blank" className={`${linkClass} text-xs`}>enlace</a>
                <a href={`/admin/grupo/${inv.id}`} className={`${linkClass} ml-2 text-xs`}>editar</a>
              </td>
              <td className="py-3 pr-2">
                {inv.guests.map((g) => (
                  <div key={g.id}>
                    <span className={g.status === "confirmed" ? "text-green-700" : g.status === "declined" ? "text-neutral-400 line-through" : ""}>
                      {g.name}
                    </span>
                    {g.dietary && <span className="ml-1 text-xs text-neutral-500">({g.dietary})</span>}
                  </div>
                ))}
                {inv.notes && <p className="mt-1 text-xs italic text-neutral-500">“{inv.notes}”</p>}
              </td>
              <td className="py-3 pr-2">{inv.contactName}<div className="text-xs text-neutral-500">{inv.email ?? "sin correo"}</div></td>
              <td className="py-3 pr-2">
                <ActionForm action={updatePhoneAction.bind(null, inv.id)} className="flex gap-1">
                  <input name="phone" defaultValue={inv.phone ?? ""} placeholder="50688881234"
                    className="w-32 rounded border border-neutral-300 px-2 py-1 transition-colors hover:border-neutral-400 focus:border-neutral-900 focus:outline-none" />
                  <SubmitButton pendingLabel="Guardando…">Guardar</SubmitButton>
                </ActionForm>
              </td>
              <td className="py-3 pr-2">
                {inv.email ? (
                  <ActionForm action={sendEmailAction.bind(null, inv.id)}>
                    <SubmitButton pendingLabel="Enviando…" variant={inv.sentEmailAt ? "secondary" : "primary"}>
                      {inv.sentEmailAt ? "Reenviar" : "Enviar"}
                    </SubmitButton>
                    {inv.sentEmailAt
                      ? <div className="mt-1 text-xs text-green-700">✓ enviado {fmt(inv.sentEmailAt)}</div>
                      : <div className="mt-1 text-xs text-neutral-500">sin enviar</div>}
                  </ActionForm>
                ) : "—"}
              </td>
              <td className="py-3 pr-2">
                <a href={whatsappLink(inv.phone, inv.contactName, inv.code, inv.guests.length)} target="_blank" rel="noreferrer" className={buttonClass("secondary")}>
                  Abrir chat
                </a>
                <ActionForm action={markWhatsappSentAction.bind(null, inv.id)} className="mt-1">
                  {inv.sentWhatsappAt
                    ? <div className="text-xs text-green-700">✓ enviado {fmt(inv.sentWhatsappAt)}</div>
                    : null}
                  <SubmitButton asLink pendingLabel="Guardando…" className="text-xs">
                    {inv.sentWhatsappAt ? "marcar de nuevo" : "marcar enviado"}
                  </SubmitButton>
                </ActionForm>
              </td>
              <td className="py-3 pr-2">{fmt(inv.viewedAt)}</td>
              <td className="py-3">{fmt(inv.respondedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      {shown.length === 0 && <p className="mt-6 text-sm text-neutral-500">Ningún grupo coincide con la búsqueda.</p>}
    </main>
  );
}
