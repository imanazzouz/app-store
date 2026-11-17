/**
 * Minimal CSV writer (RFC 4180 style) for enquiry exports.
 */
export function toCsv(
  rows: Record<string, unknown>[],
  columns: { key: string; label: string }[],
): string {
  const escape = (value: unknown): string => {
    const s = value === null || value === undefined ? '' : String(value);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const head = columns.map((c) => escape(c.label)).join(',');
  const body = rows
    .map((row) => columns.map((c) => escape(row[c.key])).join(','))
    .join('\r\n');
  return `${head}${body ? `\r\n${body}` : ''}`;
}

/** ISO date → "2026-11-17 14:03" (UTC-safe, sortable). */
export function formatDate(value: unknown): string {
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return '';
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
