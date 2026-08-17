'use client';

import { useState } from 'react';
import { useCmlMutations } from '../hooks/useCmlMutations';

export function CmlImportPage({ equipmentId }: { equipmentId: string }) {
  const mutations = useCmlMutations(equipmentId);
  const [text, setText] = useState('');
  const parseRows = () => text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => {
    const [cmlNumber, cmlType, componentType, locationDescription] = line.split(',').map((part) => part.trim());
    return { cmlNumber, cmlType, componentType, locationDescription };
  });
  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
        <h2 className="text-2xl font-bold text-[var(--psm-text)]">Import CML/TML Records</h2>
        <p className="mt-1 text-sm text-[var(--psm-muted)]">Paste CSV rows using: cmlNumber,cmlType,componentType,locationDescription. The backend creates an import job and validates rows before commit.</p>
      </div>
      <textarea className="min-h-72 w-full rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 text-sm text-[var(--psm-text)] shadow-sm" value={text} onChange={(event) => setText(event.target.value)} />
      <button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" disabled={mutations.importRows.isPending || !text.trim()} onClick={() => mutations.importRows.mutate(parseRows())}>{mutations.importRows.isPending ? 'Uploading...' : 'Create Import Job'}</button>
      {mutations.importRows.data ? <pre className="overflow-auto rounded-xl bg-[var(--psm-surface)] p-4 text-xs text-[var(--psm-text)]">{JSON.stringify(mutations.importRows.data, null, 2)}</pre> : null}
    </div>
  );
}
