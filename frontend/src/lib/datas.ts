// Date helpers. Deadlines travel as "YYYY-MM-DD" strings and are parsed as
// local dates, so a deadline never shows up one day earlier because of UTC.

const DIA_MS = 86_400_000;

export function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(base: Date, n: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
}

export function parseDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function hojeMeiaNoite(): Date {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return hoje;
}

export function daysUntil(iso: string): number {
  return Math.round((parseDate(iso).getTime() - hojeMeiaNoite().getTime()) / DIA_MS);
}

export function fmtDate(iso: string): string {
  return parseDate(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "");
}

export function fmtHours(horas: number): string {
  return `${(Math.round(horas * 10) / 10).toString().replace(".", ",")}h`;
}

export function fmtClock(segundos: number): string {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export type Urgencia = "late" | "soon";

// Label for deadlines that need attention: overdue, today or within 3 days.
export function prazoRelativo(iso: string): { texto: string; urgencia: Urgencia } | null {
  const n = daysUntil(iso);
  if (n < 0) return { texto: `atrasada ${-n}d`, urgencia: "late" };
  if (n === 0) return { texto: "hoje", urgencia: "soon" };
  if (n <= 3) return { texto: `em ${n}d`, urgencia: "soon" };
  return null;
}
