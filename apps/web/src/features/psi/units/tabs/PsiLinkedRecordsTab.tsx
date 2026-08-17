import type { PsiUnitDetailResponse } from '../../types/psi-unit.types';
import { PsiCard, PsiEmptyState } from '../../shared/PsiUi';

export function PsiLinkedRecordsTab({ detail }: { detail: PsiUnitDetailResponse }) {
  return <PsiCard title="Linked Records Foundation" subtitle="Equipment, MOC, PSSR, HAZOP/PHA, LOPA/SIL, Incident, MI, PTW/LOTO, SDS/Chemical, Training, and Audit finding links.">{detail.linkedRecords.length ? <div className="space-y-2">{detail.linkedRecords.map((record) => <div key={String(record.id)} className="rounded-lg border border-[var(--psm-line)] p-3"><p className="font-semibold">{String(record.linked_module)} - {String(record.linked_record_number ?? record.linked_record_id)}</p><p className="text-sm text-[var(--psm-muted)]">{String(record.relationship_type ?? 'Reference')}</p></div>)}</div> : <PsiEmptyState title="No linked records" message="Use the PSI API to link source records; the foundation enforces company/site/unit isolation." />}</PsiCard>;
}
