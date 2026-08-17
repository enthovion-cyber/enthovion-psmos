'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { materialCompatibilityService } from '../services/material-compatibility.service';
import { PsiButton, PsiCard, PsiErrorState, PsiLoadingState } from '../shared/PsiUi';

export function MaterialCompatibilityImportPage() {
  const template = useQuery({ queryKey: ['psi', 'material-compatibility-import-template'], queryFn: materialCompatibilityService.importTemplate });
  const [rowsText, setRowsText] = useState('');
  const [preview, setPreview] = useState<Record<string, any> | null>(null);
  const [error, setError] = useState<string | null>(null);
  async function runPreview() {
    setError(null);
    try {
      const rows = rowsText.trim() ? JSON.parse(rowsText) : [];
      setPreview(await materialCompatibilityService.importPreview({ rows, fileName: 'manual-material-compatibility-import.json' }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to preview material compatibility import.');
    }
  }
  if (template.isLoading) return <PsiLoadingState rows={5} />;
  if (template.isError) return <PsiErrorState message={template.error.message} onRetry={() => void template.refetch()} />;
  return (
    <div className="space-y-5">
      <PsiCard title="Import Material Compatibility" subtitle="Preview imported rows before save. Backend validates unit/site scope, required fields, duplicate records, conflicts, completeness, audit, and PSI history events.">
        <div className="grid gap-4 lg:grid-cols-2">
          <div><p className="mb-2 text-sm font-semibold">Required columns</p><div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-sm">{String((template.data as any)?.columns?.join(', ') ?? 'Template unavailable')}</div></div>
          <label className="space-y-2 text-sm font-semibold"><span>Rows JSON preview input</span><textarea rows={10} value={rowsText} onChange={(event) => setRowsText(event.target.value)} placeholder='[{"compatibility_title":"Sulfuric acid to carbon steel","unit_id":"..."}]' className="w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 font-mono text-xs" /></label>
        </div>
        <div className="mt-4 flex justify-end"><PsiButton onClick={() => void runPreview()}>Preview Import</PsiButton></div>
      </PsiCard>
      {error ? <PsiErrorState message={error} /> : null}
      {preview ? <PsiCard title="Import Preview" subtitle="Valid and error rows returned by backend validation."><pre className="overflow-auto rounded-lg bg-[var(--psm-surface-2)] p-3 text-xs">{JSON.stringify(preview, null, 2)}</pre></PsiCard> : null}
    </div>
  );
}

