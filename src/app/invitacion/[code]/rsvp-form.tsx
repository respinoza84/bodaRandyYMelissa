"use client";

import { useActionState } from "react";
import type { Guest } from "@/db/schema";
import { submitRsvp, type RsvpState } from "./actions";

export function RsvpForm({ code, guestList, phone }: { code: string; guestList: Guest[]; phone: string | null }) {
  const action = submitRsvp.bind(null, code);
  const [state, formAction, pending] = useActionState<RsvpState, FormData>(action, { ok: false, message: "" });

  return (
    <form action={formAction} className="mt-8 space-y-6">
      {guestList.length > 1 && (
        <p className="rounded bg-olive/60 px-4 py-3 text-sm">
          Hay {guestList.length} personas en esta invitación. Por favor marquen cada uno si asiste o no.
        </p>
      )}
      {guestList.map((g, i) => (
        <fieldset key={g.id} className="rounded border border-cream/40 p-4">
          <legend className="px-1 font-medium">
            {guestList.length > 1 ? `${i + 1}/${guestList.length} — ${g.name}` : g.name}
          </legend>
          <div className="mt-2 flex gap-6">
            <label className="flex items-center gap-2">
              <input type="radio" name={`status-${g.id}`} value="confirmed" defaultChecked={g.status === "confirmed"} required />
              Asistiré
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name={`status-${g.id}`} value="declined" defaultChecked={g.status === "declined"} />
              No podré
            </label>
          </div>
          <label className="mt-3 block text-sm text-cream/80">
            Alergias o dieta especial
            <input name={`dietary-${g.id}`} defaultValue={g.dietary ?? ""} className="mt-1 w-full rounded border border-cream/40 bg-cream px-3 py-2 text-ink" />
          </label>
        </fieldset>
      ))}

      <label className="block text-sm text-cream/80">
        Teléfono de contacto (opcional)
        <input name="phone" type="tel" defaultValue={phone ?? ""} placeholder="8888 1234" className="mt-1 w-full rounded border border-cream/40 bg-cream px-3 py-2 text-ink" />
      </label>
      <label className="block text-sm text-cream/80">
        Mensaje para los novios (opcional)
        <textarea name="notes" rows={3} className="mt-1 w-full rounded border border-cream/40 bg-cream px-3 py-2 text-ink" />
      </label>

      <button disabled={pending} className="w-full rounded bg-cream px-6 py-3 font-bold text-olive-deep disabled:opacity-60">
        {pending ? "Enviando…" : guestList.length > 1 ? `Confirmar los ${guestList.length} invitados` : "Confirmar asistencia"}
      </button>
      {state.message && (
        <p role="status" className={state.ok ? "text-sage" : "text-amber-200"}>{state.message}</p>
      )}
    </form>
  );
}
