import { RegulatoryMetricCard } from '../../shared/RegulatoryUi';
import { RegulatoryObligationGapTable } from '../RegulatoryObligationGapTable';
import { RegulatoryCard } from '../../shared/RegulatoryUi';
import type { RegulatoryObligationDetail } from '../../types/regulatory-obligation.types';

export function ObligationOverviewTab({ data }: { data?: RegulatoryObligationDetail | undefined }) {
  const obligation = data?.obligation;
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <RegulatoryMetricCard label="Parent Requirement" value={String(obligation?.parent_requirement_label ?? obligation?.regulatory_item_id ?? 'Missing')} tone="info" />
        <RegulatoryMetricCard label="Owner" value={String(obligation?.owner?.displayName ?? obligation?.owner_label ?? 'Unassigned')} tone={obligation?.owner_user_id ? 'good' : 'warn'} />
        <RegulatoryMetricCard label="Frequency" value={String(obligation?.frequency ?? obligation?.trigger_event ?? 'Missing')} tone={obligation?.frequency || obligation?.trigger_event ? 'good' : 'warn'} />
        <RegulatoryMetricCard label="Due Date" value={obligation?.next_due_date || obligation?.due_date ? new Date(String(obligation.next_due_date ?? obligation.due_date)).toLocaleDateString() : 'Not Set'} tone={obligation?.due_status === 'Overdue' ? 'danger' : obligation?.due_status === 'Due Soon' ? 'warn' : 'neutral'} />
      </div>
      <RegulatoryCard title="Readiness / Missing Data" subtitle={data?.readiness?.status}>
        <div className="grid gap-3 md:grid-cols-3">
          {(data?.readiness?.blockers ?? []).map((blocker, index) => <RegulatoryMetricCard key={index} label={String(blocker.label ?? blocker.key)} value={String(blocker.severity ?? 'Open')} tone="warn" />)}
        </div>
      </RegulatoryCard>
      <RegulatoryCard title="Open Gaps"><RegulatoryObligationGapTable rows={data?.gaps?.rows} /></RegulatoryCard>
    </>
  );
}
