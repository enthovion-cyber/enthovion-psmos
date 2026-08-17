import { PsiCard } from '../../shared/PsiUi';

export function LimitDocumentsSection({ value, onChange }: { value: Record<string, any>; onChange: (patch: Record<string, any>) => void }) {
  const row = value.documents?.[0] ?? {};
  const patch = (input: Record<string, unknown>) => onChange({ documents: [{ ...row, ...input }] });
  return (
    <PsiCard title="7. Documents / References" subtitle="Document Control links only. The SOL table stores metadata and snapshots, not raw files.">
      <div className="grid gap-3 md:grid-cols-3">
        <input value={row.document_id ?? ''} onChange={(e) => patch({ document_id: e.target.value })} placeholder="Document Control document ID" className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" />
        <select value={row.document_type ?? 'Safe operating limit register'} onChange={(e) => patch({ document_type: e.target.value })} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm">{['Safe operating limit register','Operating procedure','Alarm response procedure','Control narrative','Cause & effect matrix','SRS','P&ID','PFD','Equipment datasheet','Relief calculation','HAZOP report','LOPA report','Process chemistry report','Vendor manual','Engineering calculation','Regulatory/compliance basis','Emergency procedure'].map((item) => <option key={item}>{item}</option>)}</select>
        <input value={row.relationship_type ?? 'Reference'} onChange={(e) => patch({ relationship_type: e.target.value })} placeholder="Relationship type" className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" />
        <label className="flex items-center gap-2 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm"><input type="checkbox" checked={Boolean(row.required)} onChange={(e) => patch({ required: e.target.checked })} /> Required document</label>
        <label className="flex items-center gap-2 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm"><input type="checkbox" checked={Boolean(row.readiness_impact)} onChange={(e) => patch({ readiness_impact: e.target.checked })} /> Readiness impact</label>
      </div>
    </PsiCard>
  );
}
