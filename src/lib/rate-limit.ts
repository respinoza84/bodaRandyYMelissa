import { and, count, eq, gt, lt } from "drizzle-orm";
import { db } from "@/db";
import { loginAttempts } from "@/db/schema";

export const MAX_FAILED_ATTEMPTS = 5;
export const WINDOW_MINUTES = 15;

const since = () => new Date(Date.now() - WINDOW_MINUTES * 60_000);

export async function isLockedOut(ip: string) {
  const [row] = await db.select({ n: count() }).from(loginAttempts)
    .where(and(eq(loginAttempts.ip, ip), gt(loginAttempts.attemptedAt, since())));
  return row.n >= MAX_FAILED_ATTEMPTS;
}

export async function recordFailure(ip: string) {
  await db.insert(loginAttempts).values({ ip });
  // Limpieza oportunista: nada de más de un día.
  await db.delete(loginAttempts).where(lt(loginAttempts.attemptedAt, new Date(Date.now() - 24 * 60 * 60_000)));
}

export async function clearFailures(ip: string) {
  await db.delete(loginAttempts).where(eq(loginAttempts.ip, ip));
}
