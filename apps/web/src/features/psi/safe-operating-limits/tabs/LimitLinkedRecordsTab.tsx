import { PsiCard } from '../../shared/PsiUi';
import type { SafeOperatingLimitDetail } from '../../types/safe-operating-limit.types';

export function LimitLinkedRecordsTab({ detail }: { detail: SafeOperatingLimitDetail }) {
  const links = [
    ['Related process chemistry', detail.limit.related_process_chemistry_id],
    ['Related chemical', detail.limit.related_chemical_id],
    ['Related equipment design basis', detail.limit.related_equipment_design_basis_id],
    ['Related relief system', detail.limit.related_relief_system_id],
    ['Related SOP/procedure', detail.limit.related_procedure_document_id],
    ['Related P&ID/drawing', detail.limit.related_drawing_document_id]
  ];
  return <PsiCard title="Linked Records" subtitle="Foundation links for HAZOP, LOPA/SIL, MI, SIS/SIF, PTW, Training, MOC, PSSR, and PSI records."><dl className="grid gap-3 md:grid-cols-2">{links.map(([label, value]) => <div key={label} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><dt className="text-xs uppercase text-[var(--psm-muted)]">{label}</dt><dd className="mt-1 font-semibold">{String(value ?? 'Not linked')}</dd></div>)}</dl></PsiCard>;
}
