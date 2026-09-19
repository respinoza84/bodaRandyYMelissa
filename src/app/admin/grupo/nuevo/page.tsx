import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { createGroupAction } from "../../actions";
import { SubmitButton } from "../../submit-button";
import { linkClass } from "../../button-styles";

const ERRORS: Record<string, string> = {
  nombre: "Falta el nombre del contacto.",
  invitados: "Agregá al menos un invitado (uno por línea).",
};

const input = "mt-1 w-full rounded border border-neutral-300 px-3 py-2";

export default async function NewGroupPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (!(await isAdmin())) redirect("/admin/login");
  const { error } = await searchParams;

  return (
    <main className="mx-auto max-w-xl px-6 py-10">
      <a href="/admin" className={`${linkClass} text-sm`}>← Volver</a>
      <h1 className="mt-4 text-2xl">Nuevo grupo</h1>
      <p className="mt-1 text-sm text-neutral-600">Un grupo es una familia, pareja o persona sola: recibe un solo enlace.</p>
      {error && <p role="alert" className="mt-4 text-sm text-red-700">{ERRORS[error] ?? "Revisá los datos."}</p>}

      <form action={createGroupAction} className="mt-6 space-y-4">
        <label className="block text-sm">Contacto (a quien se le envía)
          <input name="contactName" required className={input} />
        </label>
        <label className="block text-sm">Correo (opcional)
          <input name="email" type="email" className={input} />
        </label>
        <label className="block text-sm">Teléfono (opcional, ej. 8888 1234)
          <input name="phone" type="tel" className={input} />
        </label>
        <label className="block text-sm">Invitados (uno por línea)
          <textarea name="guests" rows={5} required className={input} />
        </label>
        <SubmitButton variant="primary" size="md" pendingLabel="Creando…">Crear grupo</SubmitButton>
      </form>
    </main>
  );
}
