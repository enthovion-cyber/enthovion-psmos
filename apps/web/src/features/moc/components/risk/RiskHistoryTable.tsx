'use client';

import { DetailCard, EmptyState } from '../moc-detail-ui';

export function RiskHistoryTable({ history }: { history: any[] }) {
  return (
    <DetailCard title="Risk History">
      {!history.length ? <EmptyState title="No risk history yet" detail="Risk saves, recalculations, completion, locks, unlocks, and reassessment requests appear here." /> : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-xs uppercase text-slate-500"><tr><th className="border-b border-white/10 py-2">Event</th><th className="border-b border-white/10 py-2">Score</th><th className="border-b border-white/10 py-2">Level</th><th className="border-b border-white/10 py-2">Actor</th><th className="border-b border-white/10 py-2">Date</th></tr></thead>
            <tbody>
              {history.map((row) => <tr key={row.id} className="border-b border-white/5"><td className="py-3"><p className="font-bold text-white">{row.title}</p><p className="text-xs text-slate-500">{row.event_type}</p></td><td className="py-3 text-slate-300">{row.risk_score_before ?? '-'} {'->'} {row.risk_score_after ?? '-'}</td><td className="py-3 text-slate-300">{row.risk_level_before ?? '-'} {'->'} {row.risk_level_after ?? '-'}</td><td className="py-3 text-slate-400">{row.actor_id ?? '-'}</td><td className="py-3 text-slate-400">{row.created_at ? new Date(row.created_at).toLocaleString() : '-'}</td></tr>)}
            </tbody>
          </table>
        </div>
      )}
    </DetailCard>
  );
}
