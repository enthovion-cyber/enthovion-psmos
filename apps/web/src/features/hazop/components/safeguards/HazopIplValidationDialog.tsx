'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useHazopIplValidation, useHazopIplValidationMutations } from '../../hooks/useHazopIplValidation';
import type { HazopIplCriterion } from '../../types/hazop-safeguard.types';
import { HazopIplChecklist } from './HazopIplChecklist';

export function HazopIplValidationDialog({ studyId, safeguard, criteria, onClose }: { studyId: string; safeguard: any; criteria: HazopIplCriterion[]; onClose: () => void }) {
  const validation = useHazopIplValidation(studyId, safeguard?.id);
  const mutations = useHazopIplValidationMutations(studyId, safeguard?.id ?? '');
  const [items, setItems] = useState<HazopIplCriterion[]>(criteria);
  const [notes, setNotes] = useState('');
  useEffect(() => {
    if (validation.data?.items?.length) setItems(validation.data.items.map((item: any) => ({ criterion_key: item.criterion_key, criterion_label: item.criterion_label, required: item.required, result: item.result, comment: item.comment })));
    else setItems(criteria);
  }, [validation.data, criteria]);
  if (!safeguard) return null;
  const save = async (finalize: boolean) => {
    const result = await mutations.create.mutateAsync({ validationNotes: notes, items });
    if (finalize) await mutations.finalize.mutateAsync(result.id);
    onClose();
  };
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/65 p-4">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-[var(--psm-line)] bg-[var(--psm-surface)] p-5">
          <div><h2 className="text-xl font-semibold">IPL Validation Checklist</h2><p className="text-sm text-[var(--psm-muted)]">{safeguard.safeguard_number} · Backend decides final validation status.</p></div>
          <button onClick={onClose} className="rounded-lg border border-[var(--psm-line)] p-2"><X size={18} /></button>
        </div>
        <div className="space-y-4 p-5">
          <HazopIplChecklist items={items} onChange={setItems} />
          <textarea className="input min-h-24" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Validation notes, constraints, proof-test evidence, independence comments..." />
        </div>
        <div className="sticky bottom-0 flex justify-end gap-2 border-t border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
          <button onClick={onClose} className="rounded-lg border border-[var(--psm-line)] px-4 py-2 text-sm font-semibold">Cancel</button>
          <button disabled={mutations.create.isPending} onClick={() => save(false)} className="rounded-lg border border-[var(--psm-line)] px-4 py-2 text-sm font-semibold">Save Draft</button>
          <button disabled={mutations.create.isPending || mutations.finalize.isPending} onClick={() => save(true)} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">Finalize Validation</button>
        </div>
      </div>
    </div>
  );
}
