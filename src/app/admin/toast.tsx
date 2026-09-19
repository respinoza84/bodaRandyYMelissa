"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

type Kind = "success" | "error" | "info";
type ToastItem = { id: number; kind: Kind; message: string };
export type ActionResult = { ok: boolean; message: string };

const ToastContext = createContext<(kind: Kind, message: string) => void>(() => {});
export const useToast = () => useContext(ToastContext);

const STYLES: Record<Kind, string> = {
  success: "border-green-300 bg-green-50 text-green-900",
  error: "border-red-300 bg-red-50 text-red-900",
  info: "border-neutral-300 bg-white text-neutral-900",
};

function Icon({ kind }: { kind: Kind }) {
  const path = kind === "success" ? "M5 13l4 4L19 7" : kind === "error" ? "M6 6l12 12M18 6L6 18" : "M12 8h.01M11 12h1v4h1";
  return (
    <svg className="mt-0.5 size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const push = useCallback((kind: Kind, message: string) => {
    const id = ++nextId.current;
    setToasts((t) => [...t.slice(-3), { id, kind, message }]);
    setTimeout(() => dismiss(id), kind === "error" ? 7000 : 4500);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-center gap-2 sm:inset-x-auto sm:right-4 sm:items-end">
        {toasts.map((t) => (
          <div key={t.id} role={t.kind === "error" ? "alert" : "status"}
            className={`toast-in pointer-events-auto flex w-full max-w-sm items-start gap-2 rounded border px-3 py-2 text-sm shadow-lg ${STYLES[t.kind]}`}>
            <Icon kind={t.kind} />
            <p className="flex-1">{t.message}</p>
            <button onClick={() => dismiss(t.id)} aria-label="Cerrar aviso"
              className="-mr-1 rounded px-1 opacity-60 transition-opacity hover:opacity-100 focus-visible:outline-2 focus-visible:outline-neutral-900">
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// Formulario que ejecuta una acción del servidor y muestra el resultado como aviso (toast).
export function ActionForm({
  action, className, children,
}: { action: (formData: FormData) => Promise<ActionResult>; className?: string; children: React.ReactNode }) {
  const toast = useToast();
  return (
    <form
      className={className}
      action={async (formData) => {
        try {
          const r = await action(formData);
          toast(r.ok ? "success" : "error", r.message);
        } catch {
          toast("error", "No se pudo completar la acción. Recargá la página e intentá de nuevo.");
        }
      }}
    >
      {children}
    </form>
  );
}

// Muestra un aviso una sola vez al cargar la página (p. ej. tras una acción que redirige) y limpia ?ok= de la URL.
export function FlashToast({ message, kind = "success" }: { message?: string; kind?: Kind }) {
  const toast = useToast();
  const shown = useRef<string | null>(null);
  useEffect(() => {
    if (!message || shown.current === message) return;
    shown.current = message;
    toast(kind, message);
    const url = new URL(window.location.href);
    if (url.searchParams.has("ok")) { url.searchParams.delete("ok"); window.history.replaceState(null, "", url); }
  }, [message, kind, toast]);
  return null;
}
