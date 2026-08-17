import type { PlanSectionProps } from '../../types/inspection-plan.types';

export function PlanDocumentsSection({ value, onChange }: PlanSectionProps) {
  const add = () => onChange({ documents: [...value.documents, { title: '', documentType: 'Reference', status: 'Linked' }] });
  const update = (index: number, patch: Record<string, unknown>) => onChange({ documents: value.documents.map((item, i) => i === index ? { ...item, ...patch } : item) });
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
      <div className="flex items-center justify-between"><h2 className="font-bold text-[var(--psm-text)]">Documents / References</h2><button type="button" onClick={add} className="rounded-lg border border-[var(--psm-line)] px-3 py-1.5 text-sm font-semibold text-[var(--psm-text)]">Link document</button></div>
      <div className="mt-3 space-y-2">{value.documents.map((doc, index) => <div key={index} className="grid gap-2 md:grid-cols-4"><input value={String(doc.title ?? '')} onChange={(e) => update(index, { title: e.target.value })} placeholder="Document title" className="rounded border border-[var(--psm-line)] bg-transparent px-2 py-1 text-[var(--psm-text)]" /><input value={String(doc.documentType ?? '')} onChange={(e) => update(index, { documentType: e.target.value })} placeholder="Document type" className="rounded border border-[var(--psm-line)] bg-transparent px-2 py-1 text-[var(--psm-text)]" /><input value={String(doc.version ?? '')} onChange={(e) => update(index, { version: e.target.value })} placeholder="Revision/version" className="rounded border border-[var(--psm-line)] bg-transparent px-2 py-1 text-[var(--psm-text)]" /><input value={String(doc.status ?? '')} onChange={(e) => update(index, { status: e.target.value })} placeholder="Status" className="rounded border border-[var(--psm-line)] bg-transparent px-2 py-1 text-[var(--psm-text)]" /></div>)}</div>
      <p className="mt-3 text-xs text-[var(--psm-muted)]">Document Control links are stored as scoped snapshots; the backend does not duplicate controlled-document content.</p>
    </section>
  );
}
