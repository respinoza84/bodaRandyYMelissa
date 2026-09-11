import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Perezoso: permite que el build pase antes de que exista DATABASE_URL.
let _db: NeonHttpDatabase<typeof schema> | undefined;
function get() {
  if (!_db) {
    if (!process.env.DATABASE_URL) throw new Error("Falta DATABASE_URL (Vercel → Storage → Neon)");
    _db = drizzle(neon(process.env.DATABASE_URL), { schema });
  }
  return _db;
}
export const db = new Proxy({} as NeonHttpDatabase<typeof schema>, {
  get(_, prop) { return Reflect.get(get(), prop); },
});
