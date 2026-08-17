'use client';

import Link from 'next/link';
import { useEquipmentReadiness, useEquipmentReadinessMutations } from '../../hooks/useReadiness';
import { FitnessForServiceBadge } from '../../shared/FitnessForServiceBadge';
import { StartupBlockedBadge } from '../../shared/StartupBlockedBadge';
import { MiLoadingSkeleton } from '../../shared/MiLoadingSkeleton';
import { ActionButton, KeyValueGrid, PrimaryButton, SectionCard, SummaryGrid } from '../../safeguards/SafeguardUiPrimitives';
import { BlockerList } from '../../readiness/BlockerList';
import { ReadinessTimeline } from '../../readiness/ReadinessTimeline';
import { RestrictionList } from '../../readiness/RestrictionList';

export function FitnessReadinessTab({ equipmentId }: { equipmentId: string }) {
  const query = useEquipmentReadiness(equipmentId);
  const mutations = useEquipmentReadinessMutations(equipmentId);
  if (query.isLoading) return <MiLoadingSkeleton rows={6} />;
  if (query.isError) return <div className="rounded-xl border border-danger/30 bg-danger/10 p-5 text-danger">Unable to load equipment readiness.</div>;
  const data = query.data;
  const current = data?.current;
  const summary = data?.summary ?? {};
  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-[var(--psm-muted)]">Equipment Fitness-for-Service / Readiness</p>
            <h2 className="mt-1 text-xl font-bold">{current?.assessment_number ?? 'Current readiness preview'}</h2>
            <p className="mt-2 text-sm text-[var(--psm-muted)]">Backend-generated readiness from deficiencies, inspections, PSV, safeguards, work orders, deviations, documents, PSSR, and MOC sources.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <FitnessForServiceBadge decision={String(summary.currentReadiness ?? summary.recommendedDecision ?? 'Not assessed')} />
              <StartupBlockedBadge blocked={Boolean(summary.startupBlocked)} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <PrimaryButton onClick={() => mutations.runCheck.mutate()} disabled={mutations.runCheck.isPending}>{mutations.runCheck.isPending ? 'Checking...' : 'Run Readiness Check'}</PrimaryButton>
            <Link href={`/mechanical-integrity/equipment/${equipmentId}/readiness/new`}><ActionButton>New Assessment</ActionButton></Link>
            <Link href="/mechanical-integrity/readiness"><ActionButton>Open Register</ActionButton></Link>
          </div>
        </div>
      </section>
      <SummaryGrid cards={[
        ['Current Readiness', summary.currentReadiness],
        ['Recommended Decision', summary.recommendedDecision],
        ['Approved Decision', summary.approvedDecision],
        ['Blockers', summary.blockerCount],
        ['Critical Blockers', summary.criticalBlockers],
        ['Active Restrictions', summary.activeRestrictions],
        ['Startup Blocked', summary.startupBlocked ? 'Yes' : 'No']
      ]} />
      <div className="grid gap-5 xl:grid-cols-2">
        <SectionCard title="Current Assessment Summary">
          <KeyValueGrid items={[
            ['Assessment number', current?.assessment_number],
            ['Reason', current?.assessment_reason],
            ['Status', current?.status],
            ['Assessment date', current?.assessment_date],
            ['Assessor', current?.assessor_user_id],
            ['Reviewer', current?.reviewer_user_id],
            ['Next review due', current?.next_review_due],
            ['FFS reference', current?.ffs_assessment_reference]
          ]} />
        </SectionCard>
        <SectionCard title="Recommended / Approved Decision">
          <KeyValueGrid items={[
            ['Recommended decision', current?.recommended_decision ?? summary.recommendedDecision],
            ['Proposed decision', current?.proposed_decision],
            ['Approved decision', current?.approved_decision],
            ['Decision source', current?.decision_source],
            ['Engineering justification', current?.engineering_justification],
            ['Risk acceptance', current?.risk_acceptance_statement]
          ]} />
        </SectionCard>
      </div>
      <SectionCard title="Blockers & Warnings"><BlockerList blockers={data?.blockers} /></SectionCard>
      <SectionCard title="Restrictions"><RestrictionList restrictions={data?.restrictions} /></SectionCard>
      <SectionCard title="Assessment History">
        {data?.assessments?.length ? (
          <div className="grid gap-3">
            {data.assessments.map((assessment) => (
              <Link key={assessment.id} href={`/mechanical-integrity/readiness/assessments/${assessment.id}`} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{assessment.assessment_number}</p>
                    <p className="text-sm text-[var(--psm-muted)]">{assessment.assessment_date} | {assessment.status}</p>
                  </div>
                  <FitnessForServiceBadge decision={assessment.approved_decision ?? assessment.recommended_decision} />
                </div>
              </Link>
            ))}
          </div>
        ) : <p className="text-sm text-[var(--psm-muted)]">No saved readiness assessments yet.</p>}
      </SectionCard>
      <SectionCard title="Readiness Events"><ReadinessTimeline events={data?.history} /></SectionCard>
    </div>
  );
}
