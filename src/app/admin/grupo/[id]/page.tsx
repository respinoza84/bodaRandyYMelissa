import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { invitations } from "@/db/schema";
import { isAdmin } from "@/lib/auth";
import { invitationUrl, whatsappLink } from "@/lib/whatsapp";
import { deleteGroupAction, updateGroupAction } from "../../actions";
import { FlashToast } from "../../toast";
import { SubmitButton } from "../../submit-button";
import { buttonClass, linkClass } from "../../button-styles";

export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  nombre: "Falta el nombre del contacto.",
  invitados: "El grupo tiene que quedar con al menos un invitado.",
};
const OK: Record<string, string> = { guardado: "Cambios guardados.", creado: "Grupo creado." };

const input = "mt-1 w-full rounded border border-neutral-300 px-3 py-2";
const when = (d: Date | null) =>
  d ? d.toLocaleString("es-CR", { timeZone: "America/Costa_Rica", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

export default async function GroupPage({
  params, searchParams,
}: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; ok?: string }> }) {
  if (!(await isAdmin())) redirect("/admin/login");
  const { id } = await params;
  const { error, ok } = await searchParams;
  const invId = Number(id);
  if (!Number.isInteger(invId)) notFound();

  const inv = await db.query.invitations.findFirst({ where: eq(invitations.id, invId), with: { guests: true } });
  if (!inv) notFound();
  const guestList = [...inv.guests].sort((a, b) => a.id - b.id);
  const url = invitationUrl(inv.code);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <a href="/admin" className={`${linkClass} text-sm`}>← Volver</a>
      <h1 className="mt-4 text-2xl">{inv.groupKey} · {inv.contactName}</h1>
      <FlashToast message={ok ? (OK[ok] ?? "Listo.") : undefined} />
      {error && <p role="alert" className="mt-3 text-sm text-red-700">{ERRORS[error] ?? "Revisá los datos."}</p>}

      <section className="mt-6 rounded border border-neutral-300 p-4 text-sm">
        <p>Enlace: <a href={url} target="_blank" rel="noreferrer" className={`${linkClass} break-all select-all`}>{url}</a></p>
        <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-4">
          <div><dt className="text-neutral-500">Correo enviado</dt><dd>{when(inv.sentEmailAt)}</dd></div>
          <div><dt className="text-neutral-500">WhatsApp enviado</dt><dd>{when(inv.sentWhatsappAt)}</dd></div>
          <div><dt className="text-neutral-500">Abrió el enlace</dt><dd>{when(inv.viewedAt)}</dd></div>
          <div><dt className="text-neutral-500">Respondió</dt><dd>{when(inv.respondedAt)}</dd></div>
        </dl>
        <a href={whatsappLink(inv.phone, inv.contactName, inv.code, guestList.length)} target="_blank" rel="noreferrer"
          className={buttonClass("secondary", "sm", "mt-3")}>Abrir chat de WhatsApp</a>
        {inv.notes && (
          <blockquote className="mt-4 border-l-2 border-neutral-300 pl-3 italic">
            <span className="not-italic text-neutral-500">Mensaje de los invitados:</span><br />“{inv.notes}”
          </blockquote>
        )}
      </section>

      <form action={updateGroupAction.bind(null, inv.id)} className="mt-8 space-y-4">
        <h2 className="text-lg">Datos del grupo</h2>
        <label className="block text-sm">Contacto
          <input name="contactName" defaultValue={inv.contactName} required className={input} />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">Correo
            <input name="email" type="email" defaultValue={inv.email ?? ""} className={input} />
          </label>
          <label className="block text-sm">Teléfono
            <input name="phone" type="tel" defaultValue={inv.phone ?? ""} placeholder="50688881234" className={input} />
          </label>
        </div>

        <h2 className="pt-2 text-lg">Invitados</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-neutral-600">
              <tr><th className="py-1 pr-2">Nombre</th><th className="pr-2">Estado</th><th className="pr-2">Alergias / dieta</th><th>Quitar</th></tr>
            </thead>
            <tbody>
              {guestList.map((g) => (
                <tr key={g.id} className="border-t border-neutral-200">
                  <td className="py-2 pr-2"><input name={`name-${g.id}`} defaultValue={g.name} className="w-full rounded border border-neutral-300 px-2 py-1" /></td>
                  <td className="py-2 pr-2">
                    <select name={`status-${g.id}`} defaultValue={g.status} className="rounded border border-neutral-300 px-2 py-1">
                      <option value="pending">Sin responder</option>
                      <option value="confirmed">Asiste</option>
                      <option value="declined">No asiste</option>
                    </select>
                    {g.respondedAt && <div className="text-xs text-neutral-500">{when(g.respondedAt)}</div>}
                  </td>
                  <td className="py-2 pr-2"><input name={`dietary-${g.id}`} defaultValue={g.dietary ?? ""} className="w-full rounded border border-neutral-300 px-2 py-1" /></td>
                  <td className="py-2 text-center"><input type="checkbox" name={`remove-${g.id}`} aria-label={`Quitar a ${g.name}`} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <label className="block text-sm">Agregar invitados (uno por línea)
          <textarea name="newGuests" rows={2} className={input} />
        </label>
        <SubmitButton variant="primary" size="md" pendingLabel="Guardando…">Guardar cambios</SubmitButton>
      </form>

      <form action={deleteGroupAction.bind(null, inv.id)} className="mt-12 border-t border-neutral-200 pt-6">
        <SubmitButton variant="danger" pendingLabel="Eliminando…"
          confirm={`¿Eliminar el grupo ${inv.groupKey} (${inv.contactName}) y sus ${guestList.length} invitado(s)? No se puede deshacer.`}>
          Eliminar grupo
        </SubmitButton>
      </form>
    </main>
  );
}
