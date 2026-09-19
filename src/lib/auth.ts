import { cookies, headers } from "next/headers";
import { timingSafeEqual, createHash } from "node:crypto";
import { clearFailures, isLockedOut, recordFailure } from "./rate-limit";

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

// Comparación en tiempo constante: se comparan hashes del mismo largo, así el tiempo no revela cuántos caracteres coinciden.
function safeEqual(a: string, b: string) {
  const h = (v: string) => createHash("sha256").update(v).digest();
  return timingSafeEqual(h(a), h(b));
}

async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || "unknown";
}

export type LoginResult = "ok" | "bad" | "locked";

export async function loginAdmin(password: string): Promise<LoginResult> {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || !process.env.ADMIN_SECRET) return "bad"; // mal configurado: nunca dejar entrar

  const ip = await clientIp();
  if (await isLockedOut(ip)) return "locked";

  if (!safeEqual(password, expected)) {
    await recordFailure(ip);
    return "bad";
  }
  await clearFailures(ip);
  (await cookies()).set(COOKIE, await adminToken(), {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30,
  });
  return "ok";
}

export async function logoutAdmin() { (await cookies()).delete(COOKIE); }
