import type { PlanSectionProps } from '../../types/inspection-plan.types';

export function PlanChecklistSection({ value, onChange }: PlanSectionProps) {
  const add = () => onChange({ checklistItems: [...value.checklistItems, { itemTitle: '', requirementText: '', responseType: 'Pass/Fail', required: true, evidenceRequired: false }] });
  const update = (index: number, patch: Record<string, unknown>) => onChange({ checklistItems: value.checklistItems.map((item, i) => i === index ? { ...item, ...patch } : item) });
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
      <div className="flex items-center justify-between"><h2 className="font-bold text-[var(--psm-text)]">Checklist Foundation</h2><button type="button" onClick={add} className="rounded-lg border border-[var(--psm-line)] px-3 py-1.5 text-sm font-semibold text-[var(--psm-text)]">Add item</button></div>
      <div className="mt-3 space-y-3">{value.checklistItems.map((item, index) => <div key={index} className="grid gap-2 rounded-lg border border-[var(--psm-line)] p-3 md:grid-cols-4"><input value={String(item.itemTitle ?? '')} onChange={(e) => update(index, { itemTitle: e.target.value })} placeholder="Checklist item title" className="rounded border border-[var(--psm-line)] bg-transparent px-2 py-1 text-[var(--psm-text)]" /><input value={String(item.requirementText ?? '')} onChange={(e) => update(index, { requirementText: e.target.value })} placeholder="Requirement" className="rounded border border-[var(--psm-line)] bg-transparent px-2 py-1 text-[var(--psm-text)]" /><select value={String(item.responseType ?? 'Pass/Fail')} onChange={(e) => update(index, { responseType: e.target.value })} className="rounded border border-[var(--psm-line)] bg-[var(--psm-surface)] px-2 py-1 text-[var(--psm-text)]"><option>Pass/Fail</option><option>Yes/No</option><option>Numeric</option><option>Text</option><option>Photo</option><option>Attachment</option><option>Measurement</option><option>Date</option><option>Signature</option></select><label className="flex items-center gap-2 text-sm text-[var(--psm-text)]"><input type="checkbox" checked={!!item.evidenceRequired} onChange={(e) => update(index, { evidenceRequired: e.target.checked })} /> Evidence required</label></div>)}</div>
    </section>
  );
}
