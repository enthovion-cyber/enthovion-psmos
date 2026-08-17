'use client';

import type { MiDeficiencyDetailResponse } from '../types/deficiency.types';
import { KeyValueGrid, MissingDataList, SectionCard, cardValue } from '../safeguards/SafeguardUiPrimitives';

export function DeficiencyOverviewPanel({ detail }: { detail: MiDeficiencyDetailResponse }) {
  const row = detail.deficiency;
  return (
    <SectionCard title="Deficiency Details" description="Source, equipment, type, condition, readiness and workflow data.">
      <KeyValueGrid items={[
        ['Equipment', row.equipment_tag ?? row.equipment_id],
        ['Source module', row.source_module],
        ['Source record', row.source_record_id],
        ['Deficiency type', row.deficiency_type],
        ['Location', row.location_description ?? row.deficiency_location],
        ['Observed condition', row.observed_condition],
        ['Required condition', row.required_condition],
        ['Operation allowed', row.operation_allowed],
        ['Operating restrictions', row.operation_restrictions ?? row.operating_restrictions],
        ['FFS required', row.ffs_required],
        ['Engineering review required', row.engineering_review_required],
        ['MOC required', row.moc_required],
        ['PSSR impact', row.pssr_impact],
        ['LOPA/SIL impact', row.lopa_sil_impact],
        ['Due date', row.due_date]
      ]} />
    </SectionCard>
  );
}

export function TemporaryControlsPanel({ detail }: { detail: MiDeficiencyDetailResponse }) {
  return (
    <SectionCard title="Temporary Controls" description="Temporary restrictions, repairs, monitoring, inspection, owner, and expiry.">
      {!detail.temporaryControls?.length ? <p className="text-sm text-[var(--psm-muted)]">No temporary controls recorded.</p> : (
        <div className="grid gap-3 md:grid-cols-2">
          {detail.temporaryControls.map((control) => (
            <div key={control.id} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-sm">
              <p className="font-semibold">{cardValue(control.control_description)}</p>
              <p className="mt-1 text-[var(--psm-muted)]">Expiry: {cardValue(control.expiry_date)} · Owner: {cardValue(control.owner_user_id)}</p>
              <p className="mt-1 text-[var(--psm-muted)]">Monitoring: {cardValue(control.additional_monitoring)} · Temporary repair: {cardValue(control.temporary_repair)}</p>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

export function CorrectiveLinksPanel({ detail }: { detail: MiDeficiencyDetailResponse }) {
  return (
    <SectionCard title="Corrective Action / Linked Records" description="Universal Action Engine, work order, MOC, inspection, PM, calibration, proof-test, impairment, and document links.">
      {!detail.linkedRecords?.length ? <p className="text-sm text-[var(--psm-muted)]">No linked corrective records have been added.</p> : (
        <div className="overflow-x-auto">
          <table className="min-w-[800px] w-full text-left text-sm">
            <thead className="text-xs uppercase text-[var(--psm-muted)]"><tr><th className="py-2">Module</th><th>Record</th><th>Relationship</th><th>Required for close</th><th>Status snapshot</th></tr></thead>
            <tbody>{detail.linkedRecords.map((link) => <tr key={String(link.id)} className="border-t border-[var(--psm-line)]"><td className="py-2">{String(link.linked_module ?? '')}</td><td>{String(link.linked_record_number ?? link.linked_record_id ?? '')}</td><td>{String(link.relationship_type ?? '')}</td><td>{String(link.required_for_close ?? false)}</td><td>{String(link.status_snapshot ?? '')}</td></tr>)}</tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}

export function DeficiencyReadinessPanel({ detail }: { detail: MiDeficiencyDetailResponse }) {
  return (
    <SectionCard title="Readiness / Missing Data" description="Backend-generated blockers and warnings used for equipment readiness, PSSR readiness, closure, and dashboard attention panels.">
      <MissingDataList items={[...detail.readiness.blockers, ...detail.readiness.warnings]} />
    </SectionCard>
  );
}

export function DeficiencyHistoryPanel({ detail }: { detail: MiDeficiencyDetailResponse }) {
  return (
    <SectionCard title="History / Audit Events" description="Immutable MI history events created by workflow mutations.">
      {!detail.history?.length ? <p className="text-sm text-[var(--psm-muted)]">No history events recorded.</p> : (
        <div className="space-y-2">
          {detail.history.slice(0, 20).map((event) => (
            <div key={String(event.id)} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-sm">
              <p className="font-semibold">{String(event.event_title ?? event.event_type ?? 'Event')}</p>
              <p className="text-xs text-[var(--psm-muted)]">{String(event.created_at ?? '')} · {String(event.actor_user_id ?? '')}</p>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
