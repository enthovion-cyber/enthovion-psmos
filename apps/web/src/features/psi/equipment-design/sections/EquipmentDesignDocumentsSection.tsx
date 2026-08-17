import { PsiCard } from '../../shared/PsiUi';
import type { EquipmentDesignLookups } from '../../types/equipment-design.types';

const c = 'rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm';

export function EquipmentDesignDocumentsSection({ value, lookups, onChange }: { value: Record<string, any>; lookups?: EquipmentDesignLookups | undefined; onChange: (patch: Record<string, any>) => void }) {
  const documents = Array.isArray(value.documents) ? value.documents : [];
  const update = (patch: Record<string, unknown>) => onChange({ documents: [{ document_type: 'Equipment datasheet', relationship_type: 'Reference', required: true, readiness_impact: true, ...documents[0], ...patch }] });
  return <PsiCard title="8. Documents / References" subtitle="Link controlled Document Control records. Datasheets, drawings, calculations, certificates, relief calculations, MOC/PSSR/HAZOP/LOPA, and engineering studies are snapshot-linked.">
    <div className="grid gap-3 md:grid-cols-4">
      <input value={documents[0]?.document_id ?? ''} onChange={(e) => update({ document_id: e.target.value })} placeholder="Document Control ID" className={c} />
      <input value={documents[0]?.document_number ?? ''} onChange={(e) => update({ document_number: e.target.value })} placeholder="Document number" className={c} />
      <input value={documents[0]?.document_title ?? ''} onChange={(e) => update({ document_title: e.target.value })} placeholder="Document title" className={c} />
      <select value={documents[0]?.document_type ?? 'Equipment datasheet'} onChange={(e) => update({ document_type: e.target.value })} className={c}>{(lookups?.documentTypes ?? ['Equipment datasheet']).map((item) => <option key={item}>{item}</option>)}</select>
      <input value={documents[0]?.document_status ?? ''} onChange={(e) => update({ document_status: e.target.value })} placeholder="Document status" className={c} />
      <input value={documents[0]?.document_revision ?? ''} onChange={(e) => update({ document_revision: e.target.value })} placeholder="Revision" className={c} />
      <label className={`${c} flex items-center gap-2`}><input type="checkbox" checked={documents[0]?.required !== false} onChange={(e) => update({ required: e.target.checked })} /> Required evidence</label>
      <label className={`${c} flex items-center gap-2`}><input type="checkbox" checked={documents[0]?.readiness_impact !== false} onChange={(e) => update({ readiness_impact: e.target.checked })} /> Readiness impact</label>
    </div>
  </PsiCard>;
}
