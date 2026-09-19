// Estilos compartidos de botones y enlaces del panel: hover, active, foco de teclado y deshabilitado.
export type Variant = "primary" | "secondary" | "danger";
export type Size = "sm" | "md";

const base =
  "inline-flex items-center justify-center gap-2 rounded font-medium transition-colors " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 " +
  "disabled:cursor-not-allowed disabled:opacity-60";

const variants: Record<Variant, string> = {
  primary: "bg-neutral-900 text-white hover:bg-neutral-700 active:bg-neutral-800",
  secondary: "border border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-100 active:bg-neutral-200",
  danger: "border border-red-300 bg-white text-red-700 hover:bg-red-50 active:bg-red-100",
};
const sizes: Record<Size, string> = { sm: "px-2.5 py-1 text-sm", md: "px-4 py-2 text-sm" };

export const buttonClass = (variant: Variant = "secondary", size: Size = "sm", extra = "") =>
  [base, variants[variant], sizes[size], extra].filter(Boolean).join(" ");

// Enlaces de texto y botones "de texto" (p. ej. "marcar enviado").
export const linkClass =
  "underline underline-offset-2 transition-colors hover:text-neutral-500 active:text-neutral-700 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 " +
  "disabled:cursor-not-allowed disabled:opacity-60";
