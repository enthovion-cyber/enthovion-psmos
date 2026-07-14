'use client';
export function FollowupRecommendationPanel({ data }: { data?: any }) {
  const entries = data ? Object.entries(data).filter(([k, v]) => typeof v === 'boolean' || ['investigationPriority','investigationLevelRequired','suggestedDueDate','suggestedInvestigationOwner'].includes(k)) : [];
  return <div className="space-y-3"><div className="grid gap-2 md:grid-cols-3">{entries.map(([k, v]) => <div key={k} className="rounded-lg border border-slate-200 p-3 dark:border-cyan-300/10"><div className="text-xs text-slate-500 dark:text-slate-400">{k.replaceAll(/([A-Z])/g, ' $1')}</div><div className="text-sm font-bold text-slate-900 dark:text-slate-100">{typeof v === 'boolean' ? (v ? 'Yes' : 'No') : String(v ?? '-')}</div></div>)}</div>{data?.reasons?.length ? <ul className="rounded-lg border border-blue-400/20 bg-blue-500/10 p-3 text-sm text-blue-700 dark:text-blue-100">{data.reasons.map((r: string) => <li key={r}>- {r}</li>)}</ul> : null}</div>;
}
