import { AuditButton, AuditCard } from '../shared/AuditUi';

export function AuditTrendRecalculateDialog({ disabled, reason, onRecalculate, saving }: { disabled?: boolean; reason?: string; onRecalculate: () => void; saving?: boolean }) {
  return <AuditCard title="Recalculate Trend" subtitle="Recalculation creates a new run/version; it does not overwrite historical snapshots."><AuditButton onClick={onRecalculate} disabled={disabled || saving} title={disabled ? reason ?? 'Recalculation is not allowed' : 'Create a new recalculated trend run'}>{saving ? 'Recalculating...' : 'Recalculate'}</AuditButton></AuditCard>;
}
