'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { processChemistryService } from '../services/process-chemistry.service';
import { PsiButton, PsiCard, PsiErrorState, PsiLoadingState } from '../shared/PsiUi';

export function ProcessChemistryImportPage() {
  const template = useQuery({ queryKey: ['psi', 'process-chemistry-import-template'], queryFn: () => processChemistryService.importTemplate() });
  const [rowsJson, setRowsJson] = useState('[]');
  const [error, setError] = useState<string | null>(null);
  const importMutation = useMutation({ mutationFn: (input: Record<string, unknown>) => processChemistryService.importPreview(input) });
  if (template.isLoading) return <PsiLoadingState rows={4} />;
  if (template.isError) return <PsiErrorState message={template.error.message} onRetry={() => void template.refetch()} />;
  const runImport = () => {
    try {
      const rows = JSON.parse(rowsJson);
      if (!Array.isArray(rows)) throw new Error('Rows JSON must be an array.');
      setError(null);
      importMutation.mutate({ rows, fileName: 'process-chemistry-manual-import.json' });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Invalid import JSON.');
    }
  };
  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase text-primary">PSI Phase 3 Import</p>
        <h1 className="text-2xl font-bold">Import Process Chemistry</h1>
        <p className="mt-2 max-w-3xl text-sm text-[var(--psm-muted)]">Preview import rows through the backend validation job. File upload storage can pass rows/file keys into this same API.</p>
      </div>
      <PsiCard title="Import Template" subtitle={`Supported formats: ${Array.isArray(template.data?.supportedFormats) ? template.data.supportedFormats.join(', ') : 'CSV/XLSX'}`}>
        <div className="flex flex-wrap gap-2">{Array.isArray(template.data?.columns) ? template.data.columns.map((column) => <span key={String(column)} className="rounded-full border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-2 py-1 text-xs">{String(column)}</span>) : null}</div>
      </PsiCard>
      <PsiCard title="Preview Rows" subtitle="Paste parsed CSV/XLSX rows as JSON. Backend validates unit mapping, required chemistry fields, and import readiness.">
        {error ? <p className="mb-3 rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{error}</p> : null}
        <textarea value={rowsJson} onChange={(event) => setRowsJson(event.target.value)} className="min-h-64 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 font-mono text-sm" />
        <div className="mt-3 flex justify-end"><PsiButton onClick={runImport} disabled={importMutation.isPending}>{importMutation.isPending ? 'Validating...' : 'Preview Import'}</PsiButton></div>
      </PsiCard>
      {importMutation.data ? <PsiCard title="Import Preview Result"><pre className="overflow-auto rounded-lg bg-[var(--psm-surface-2)] p-3 text-xs">{JSON.stringify(importMutation.data, null, 2)}</pre></PsiCard> : null}
      {importMutation.isError ? <PsiErrorState message={importMutation.error.message} /> : null}
    </div>
  );
}
