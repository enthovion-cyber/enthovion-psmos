import { PsiCard } from '../../shared/PsiUi';
import type { DrawingDetail } from '../../types/drawing.types';

export function DrawingLinkedRecordsTab({ detail }: { detail: DrawingDetail }) {
  return <PsiCard title="Linked Equipment / Records" subtitle="Equipment, lines, instruments, relief devices, SIF/SIS, SOL, equipment design, relief systems, process chemistry, HAZOP, LOPA, MOC, PSSR, PTW/LOTO, SOPs, emergency response, and audit evidence links.">{!detail.relationships.length ? <p className="text-sm text-[var(--psm-muted)]">No linked records yet.</p> : <div className="grid gap-3 md:grid-cols-2">{detail.relationships.map((row) => <div key={row.id} className="rounded-lg border border-[var(--psm-line)] p-3"><p className="font-semibold">{row.linked_module}: {row.linked_record_label ?? row.linked_record_id}</p><p className="text-sm text-[var(--psm-muted)]">{row.relationship_type}</p><div className="mt-2 flex flex-wrap gap-2 text-xs text-[var(--psm-muted)]"><span>Readiness: {row.readiness_impact ? 'Yes' : 'No'}</span><span>PSSR: {row.pssr_impact ? 'Yes' : 'No'}</span><span>MOC: {row.moc_impact ? 'Yes' : 'No'}</span></div></div>)}</div>}</PsiCard>;
}
