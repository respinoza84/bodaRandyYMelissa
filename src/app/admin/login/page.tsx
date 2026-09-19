import { redirect } from "next/navigation";
import { loginAdmin } from "@/lib/auth";

async function login(formData: FormData) {
  "use server";
  const result = await loginAdmin(String(formData.get("password") ?? ""));
  redirect(result === "ok" ? "/admin" : `/admin/login?error=${result === "locked" ? "locked" : "1"}`);
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="mx-auto max-w-sm px-6 py-24">
      <h1 className="text-2xl">Panel de invitados</h1>
      <form action={login} className="mt-6 space-y-4">
        <input name="password" type="password" placeholder="Contraseña" autoFocus className="w-full rounded border border-neutral-300 px-3 py-2" />
        {error && (
          <p className="text-sm text-red-700">
            {error === "locked" ? "Demasiados intentos. Esperá 15 minutos e intentá de nuevo." : "Contraseña incorrecta."}
          </p>
        )}
        <button className="w-full rounded bg-neutral-900 px-4 py-2 text-white">Entrar</button>
      </form>
    </main>
  );
}
