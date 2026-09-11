import { cookies } from "next/headers";

const COOKIE = "boda_admin";

async function sign(value: string) {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(process.env.ADMIN_SECRET!), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function adminToken() { return sign("admin-ok"); }

export async function isAdmin() {
  const c = (await cookies()).get(COOKIE)?.value;
  return !!c && c === (await adminToken());
}

export async function loginAdmin(password: string) {
  if (password !== process.env.ADMIN_PASSWORD) return false;
  (await cookies()).set(COOKIE, await adminToken(), {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30,
  });
  return true;
}

export async function logoutAdmin() { (await cookies()).delete(COOKIE); }
