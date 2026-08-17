'use client';

import { useState } from 'react';
import { useReadinessDetail } from '../hooks/useReadinessDetail';
import { useReadinessMutations } from '../hooks/useReadinessMutations';
import { MiLoadingSkeleton } from '../shared/MiLoadingSkeleton';
import { KeyValueGrid, MissingDataList, SectionCard, SummaryGrid } from '../safeguards/SafeguardUiPrimitives';
import { BlockerList } from './BlockerList';
import { ReadinessApprovalDialog } from './ReadinessApprovalDialog';
import { ReadinessDetailHeader } from './ReadinessDetailHeader';
import { ReadinessTimeline } from './ReadinessTimeline';
import { RestrictionList } from './RestrictionList';

export function ReadinessDetailPage({ assessmentId, mode }: { assessmentId: string; mode?: 'edit' | 'review' }) {
  const query = useReadinessDetail(assessmentId);
  const mutations = useReadinessMutations(assessmentId);
  const [dialog, setDialog] = useState<'approve' | 'reject' | 'override' | null>(null);
  if (query.isLoading) return <MiLoadingSkeleton rows={8} />;
  if (query.isError || !query.data) return <div className="rounded-xl border border-danger/30 bg-danger/10 p-5 text-danger">Unable to load readiness assessment.</div>;
  const { assessment, blockers, restrictions, linkedRecords, history, readiness, readOnly } = query.data;
  const disabled = readOnly || assessment.read_only;
  return (
    <div className="space-y-5">
      <ReadinessDetailHeader
        assessment={assessment}
        assessmentId={assessmentId}
        disabled={Boolean(disabled)}
        running={mutations.runCheck.isPending}
        submitting={mutations.submit.isPending}
        onRunCheck={() => mutations.runCheck.mutate({ reason: 'Manual rerun from readiness detail' })}
        onSubmit={() => mutations.submit.mutate({ proposedDecision: assessment.proposed_decision ?? assessment.recommended_decision })}
        onReview={() => mutations.review.mutate({})}
        onApprove={() => setDialog('approve')}
        onReject={() => setDialog('reject')}
        onOverride={() => setDialog('override')}
      />
      {readOnly ? <div className="rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm text-warning">This readiness assessment is locked/read-only because it is approved, rejected, closed, or superseded.</div> : null}
      <SummaryGrid cards={[
        ['Blocker Count', assessment.blocker_count ?? blockers.length],
        ['Critical Blockers', assessment.critical_blockers ?? blockers.filter((item) => ['Critical','Startup Blocker'].includes(item.severity)).length],
        ['Active Restrictions', assessment.active_restrictions ?? restrictions.length],
        ['FFS Required', assessment.ffs_required ? 'Yes' : 'No'],
        ['MOC Required', assessment.moc_required ? 'Yes' : 'No'],
        ['PSSR Impact', assessment.pssr_impact ? 'Yes' : 'No']
      ]} />
      <SectionCard title="Assessment Snapshot" description="Backend-generated decision basis and approval metadata.">
        <KeyValueGrid items={[
          ['Recommended decision', assessment.recommended_decision],
          ['Proposed decision', assessment.proposed_decision],
          ['Approved decision', assessment.approved_decision],
          ['Decision source', assessment.decision_source],
          ['Technical basis', assessment.technical_basis],
          ['Risk acceptance statement', assessment.risk_acceptance_statement],
          ['Next review due', assessment.next_review_due],
          ['Approved by', assessment.approved_by],
          ['Approved at', assessment.approved_at]
        ]} />
      </SectionCard>
      <SectionCard title="Readiness / Missing Data Panel" description="Backend readiness rules decide if this assessment can move forward.">
        <MissingDataList items={readiness?.missing} />
      </SectionCard>
      <SectionCard title="Readiness Blockers"><BlockerList blockers={blockers} onClear={(id) => mutations.clearBlocker.mutate({ blockerId: id })} onWaive={(id) => mutations.waiveBlocker.mutate({ blockerId: id, reason: 'Waived from readiness detail' })} onCreateAction={(item) => mutations.createActionFromBlocker.mutate({ blockerId: item.id, values: { title: item.recommended_action ?? item.blocker_title, ownerId: item.owner_user_id ?? undefined, dueDate: item.due_date ?? undefined } })} /></SectionCard>
      <SectionCard title="Operating Restrictions"><RestrictionList restrictions={restrictions} /></SectionCard>
      <SectionCard title="Linked PSSR / MOC / Deviation / Evidence Records">
        {linkedRecords?.length ? <KeyValueGrid items={linkedRecords.map((record) => [String(record.linked_record_number ?? record.linked_record_id), `${record.linked_module ?? 'Record'} - ${record.relationship_type ?? 'Evidence'}`])} /> : <p className="text-sm text-[var(--psm-muted)]">No linked records are attached to this readiness assessment.</p>}
      </SectionCard>
      <SectionCard title="Readiness History"><ReadinessTimeline events={history} /></SectionCard>
      {dialog ? <ReadinessApprovalDialog mode={dialog} saving={mutations.approve.isPending || mutations.reject.isPending || mutations.override.isPending} onClose={() => setDialog(null)} onSubmit={(input) => {
        const action = dialog === 'approve' ? mutations.approve : dialog === 'reject' ? mutations.reject : mutations.override;
        action.mutate(input, { onSuccess: () => setDialog(null) });
      }} /> : null}
    </div>
  );
}
