import { TrainingMetricCard } from '../shared/TrainingUi';

export function WorkerMatrixSummaryCards({ summary = {} }: { summary?: Record<string, any> }) {
  const cards = [['Required', summary.total_required], ['Complete', summary.complete_count], ['Incomplete', summary.incomplete_count], ['Overdue', summary.overdue_count], ['Expiring Soon', summary.expiring_soon_count], ['Missing Evidence', summary.missing_evidence_count], ['Pending Verification', summary.pending_verification_count], ['Waived', summary.waived_count], ['Safety-Critical Gaps', summary.safety_critical_gap_count], ['PTW Blockers', summary.ptw_blocker_count], ['MOC Blockers', summary.moc_blocker_count], ['PSSR Blockers', summary.pssr_blocker_count]] as const;
  return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{cards.map(([label, value]) => <TrainingMetricCard key={label} label={label} value={value ?? 0} tone={String(label).includes('Blocker') || String(label).includes('Missing') || String(label).includes('Overdue') ? 'warn' : 'neutral'} />)}</div>;
}
