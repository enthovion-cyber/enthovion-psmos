'use client';

import { DetailCard, EmptyState } from '../moc-detail-ui';

export function RiskHistoryTable({ history }: { history: any[] }) {
  return (
    <DetailCard title="HAZOP Risk Assessment Audit Log">
      {!history.length ? (
        <EmptyState
          title="No risk revision history yet"
          detail="Risk saves, recalculations, completions, locks, unlocks, and reassessment requests appear here."
        />
      ) : (
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead className="border-b border-[var(--psm-line)] font-bold uppercase tracking-wider text-[var(--psm-muted)]">
              <tr>
                <th className="py-2.5 px-3">Event / Action</th>
                <th className="py-2.5 px-3">Score Shift</th>
                <th className="py-2.5 px-3">Level Shift</th>
                <th className="py-2.5 px-3">Evaluator</th>
                <th className="py-2.5 px-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--psm-line)]">
              {history.map((row) => (
                <tr key={row.id} className="hover:bg-[var(--psm-surface-2)] transition-colors">
                  <td className="py-2.5 px-3">
                    <p className="font-bold text-[var(--psm-fg)]">{row.title}</p>
                    <p className="text-[10px] text-[var(--psm-muted)]">{row.event_type}</p>
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-[var(--psm-fg)]">
                    {row.risk_score_before ?? '-'} → {row.risk_score_after ?? '-'}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-[var(--psm-fg)]">
                    {row.risk_level_before ?? '-'} → {row.risk_level_after ?? '-'}
                  </td>
                  <td className="py-2.5 px-3 text-[var(--psm-muted)]">{row.actor_id ?? 'System'}</td>
                  <td className="py-2.5 px-3 text-[var(--psm-muted)]">
                    {row.created_at ? new Date(row.created_at).toLocaleString() : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DetailCard>
  );
}
