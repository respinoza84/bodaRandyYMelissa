import { redirect } from "next/navigation";
import { db } from "@/db";
import { isAdmin } from "@/lib/auth";
import { whatsappLink, invitationUrl } from "@/lib/whatsapp";
import { logoutAction, markWhatsappSentAction, sendEmailAction, updatePhoneAction } from "./actions";

export const dynamic = "force-dynamic";

function fmt(d: Date | null) { return d ? d.toLocaleDateString("es-CR", { day: "2-digit", month: "short" }) : "—"; }

export default async function AdminPage() {
  if (!(await isAdmin())) redirect("/admin/login");

  const list = await db.query.invitations.findMany({ with: { guests: true }, orderBy: (t, { asc }) => asc(t.groupKey) });
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
        <div className="flex gap-4 text-sm">
          <a href="/admin/export" className="underline">Exportar CSV</a>
          <form action={logoutAction}><button className="underline">Salir</button></form>
        </div>
      </header>

      <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
        {[
          ["Invitados", stats.total], ["Confirmados", stats.confirmed], ["No asisten", stats.declined],
          ["Sin responder", stats.pending], ["Grupos respondieron", `${stats.groupsAnswered}/${list.length}`],
        ].map(([k, v]) => (
          <div key={String(k)} className="rounded border border-neutral-300 p-3">
            <dt className="text-sm text-neutral-600">{k}</dt>
            <dd className="text-2xl">{v}</dd>
          </div>
        ))}
      </dl>

      <table className="mt-8 w-full text-sm">
        <thead className="text-left text-neutral-600">
          <tr>
            <th className="py-2">Grupo</th><th>Invitados</th><th>Contacto</th><th>Teléfono</th>
            <th>Correo</th><th>WhatsApp</th><th>Visto</th><th>Respondió</th>
          </tr>
        </thead>
        <tbody>
          {list.map((inv) => (
            <tr key={inv.id} className="border-t border-neutral-200 align-top">
              <td className="py-3 pr-2">
                <div>{inv.groupKey}</div>
                <a href={invitationUrl(inv.code)} target="_blank" className="text-xs underline">enlace</a>
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
                <form action={updatePhoneAction.bind(null, inv.id)} className="flex gap-1">
                  <input name="phone" defaultValue={inv.phone ?? ""} placeholder="50688881234" className="w-32 rounded border border-neutral-300 px-2 py-1" />
                  <button className="rounded border border-neutral-300 px-2">Guardar</button>
                </form>
              </td>
              <td className="py-3 pr-2">
                {inv.email ? (
                  <form action={sendEmailAction.bind(null, inv.id)}>
                    <button className="rounded border border-neutral-300 px-2 py-1">{inv.sentEmailAt ? "Reenviar" : "Enviar"}</button>
                    <div className="text-xs text-neutral-500">{fmt(inv.sentEmailAt)}</div>
                  </form>
                ) : "—"}
              </td>
              <td className="py-3 pr-2">
                <a href={whatsappLink(inv.phone, inv.contactName, inv.code)} target="_blank" rel="noreferrer" className="rounded border border-neutral-300 px-2 py-1">
                  Abrir chat
                </a>
                <form action={markWhatsappSentAction.bind(null, inv.id)} className="mt-1">
                  <button className="text-xs underline">{inv.sentWhatsappAt ? `enviado ${fmt(inv.sentWhatsappAt)}` : "marcar enviado"}</button>
                </form>
              </td>
              <td className="py-3 pr-2">{fmt(inv.viewedAt)}</td>
              <td className="py-3">{fmt(inv.respondedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
