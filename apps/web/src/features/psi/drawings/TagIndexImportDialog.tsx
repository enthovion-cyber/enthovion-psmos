'use client';

import { useState } from 'react';
import { useDrawingMutations } from '../hooks/useDrawingMutations';
import { PsiButton, PsiCard } from '../shared/PsiUi';

export function TagIndexImportDialog({ drawingId }: { drawingId: string }) {
  const mutations = useDrawingMutations(drawingId);
  const [csvRows, setCsvRows] = useState('');
  const rows = csvRows.split('\n').map((line) => line.trim()).filter(Boolean).map((line) => {
    const [tag_number, tag_type, tag_description, service, sheet_page_reference] = line.split(',').map((item) => item?.trim());
    return { tag_number, tag_type, tag_description, service, sheet_page_reference, verification_status: 'Unverified', source_method: 'CSV import' };
  });
  return (
    <PsiCard title="Import Tag Index" subtitle="Paste CSV rows in the PDF template order: tag_number, tag_type, tag_description, service, sheet_page_reference. Backend validates before commit.">
      <textarea className="min-h-28 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={csvRows} onChange={(event) => setCsvRows(event.target.value)} />
      <div className="mt-3 flex gap-2">
        <PsiButton variant="secondary" disabled={!rows.length || mutations.importTagIndex.isPending} onClick={() => void mutations.importTagIndex.mutateAsync({ rows })}>Preview</PsiButton>
        <PsiButton disabled={!rows.length || mutations.importTagIndex.isPending} onClick={() => void mutations.importTagIndex.mutateAsync({ rows, commit: true })}>Commit Import</PsiButton>
      </div>
    </PsiCard>
  );
}
