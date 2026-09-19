// Deja solo dígitos. Un número de Costa Rica de 8 dígitos se guarda con el código de país (506), que wa.me necesita.
export function normalizePhone(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  return digits.length === 8 ? `506${digits}` : digits;
}
