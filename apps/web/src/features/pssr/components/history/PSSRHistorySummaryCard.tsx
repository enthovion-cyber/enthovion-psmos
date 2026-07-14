'use client';
import { Badge, PSSRCard } from '../pssr-ui';
export function PSSRHistorySummaryCard({ summary }: { summary: any }) {
  return <PSSRCard title="History Summary"><div className="grid gap-3 sm:grid-cols-3"><Metric label="Total Events" value={summary?.totalEvents} /><Metric label="Safety Critical" value={summary?.safetyCriticalEvents} tone="text-red-300" /><Metric label="Latest Event" value={summary?.latestEventAt ? new Date(summary.latestEventAt).toLocaleString() : '-'} /></div><div className="mt-3 flex flex-wrap gap-2">{Object.entries(summary?.byCategory ?? {}).map(([key, value]) => <Badge key={key}>{key}: {String(value)}</Badge>)}</div></PSSRCard>;
}
function Metric({ label, value, tone = 'text-white' }: { label: string; value: any; tone?: string }) { return <div className="rounded-lg border border-white/10 bg-slate-950/30 p-3"><p className="text-xs font-bold uppercase text-slate-500">{label}</p><p className={`mt-1 text-lg font-black ${tone}`}>{value ?? 0}</p></div>; }
