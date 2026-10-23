const TZ = "Europe/Paris";

/** Date du jour au format AAAA-MM-JJ, à l'heure de Paris. */
export function today(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(now);
}

export function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(from: string, to: string): number {
  const a = Date.parse(`${from}T12:00:00Z`);
  const b = Date.parse(`${to}T12:00:00Z`);
  return Math.round((b - a) / 86_400_000);
}

export function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T12:00:00Z`));
}

export function formatDate(isoDate: string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long" }) {
  return new Date(`${isoDate}T12:00:00Z`).toLocaleDateString("fr-FR", { timeZone: "UTC", ...opts });
}

export function formatDateTime(d: Date) {
  return d.toLocaleDateString("fr-FR", { timeZone: TZ, day: "numeric", month: "long", year: "numeric" });
}
