export function IncidentStatusBadge({ status }: { status?: string }) { return <Badge value={status} map={{ Closed:'green', Approved:'green', Reopened:'amber', Reported:'blue', Triage:'amber', 'Investigation In Progress':'blue', 'RCA Required':'red', 'Pending Review':'purple', 'Cancelled / Void':'slate' }} />; }
export function Badge({ value, map = {} }: { value?: string | boolean | undefined; map?: Record<string, string> | undefined }) {
  const text = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value || '-';
  const tone = map[String(text)] ?? (String(text).match(/critical|fatal|tier 1|high|overdue|yes/i) ? 'red' : String(text).match(/major|tier 2|pending|review/i) ? 'amber' : String(text).match(/closed|complete|low|no/i) ? 'green' : 'blue');
  const cls: Record<string,string> = { red:'border-red-400/25 bg-red-500/10 text-red-700 dark:text-red-200', amber:'border-amber-400/25 bg-amber-500/10 text-amber-700 dark:text-amber-200', green:'border-emerald-400/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200', blue:'border-blue-400/25 bg-blue-500/10 text-blue-700 dark:text-blue-200', purple:'border-purple-400/25 bg-purple-500/10 text-purple-700 dark:text-purple-200', slate:'border-slate-400/25 bg-slate-500/10 text-slate-700 dark:text-slate-200' };
  return <span className={`inline-flex rounded px-2 py-0.5 text-[11px] font-bold ${cls[tone]}`}>{text}</span>;
}
