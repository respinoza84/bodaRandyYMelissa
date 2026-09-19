"use client";

import { useFormStatus } from "react-dom";
import { buttonClass, linkClass, type Size, type Variant } from "./button-styles";

function Spinner() {
  return (
    <svg className="size-3.5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

// Botón de envío: se deshabilita y muestra un spinner mientras el formulario se procesa, así un segundo clic no repite la acción.
// `confirm` pide confirmación antes de enviar.
export function SubmitButton({
  children, pendingLabel, variant = "secondary", size = "sm", asLink = false, confirm, className,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  variant?: Variant;
  size?: Size;
  asLink?: boolean; // se ve como enlace de texto en vez de botón
  confirm?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  const classes = asLink ? [linkClass, className].filter(Boolean).join(" ") : buttonClass(variant, size, className);
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      onClick={(e) => { if (confirm && !window.confirm(confirm)) e.preventDefault(); }}
      className={classes}
    >
      {pending && <Spinner />}
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  );
}
