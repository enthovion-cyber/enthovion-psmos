'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { reliefSystemService } from '../services/relief-system.service';
import { PsiButton, PsiCard, PsiEmptyState, PsiErrorState, PsiLoadingState } from '../shared/PsiUi';

export function ReliefSystemImportPage() {
  const template = useQuery({ queryKey: ['psi', 'relief-system-import-template'], queryFn: () => reliefSystemService.importTemplate() });
  const [rowsJson, setRowsJson] = useState('[]');
  const preview = useMutation({ mutationFn: (input: Record<string, unknown>) => reliefSystemService.importPreview(input) });

  if (template.isLoading) return <PsiLoadingState rows={4} />;
  if (template.isError) return <PsiErrorState message={template.error.message} onRetry={() => void template.refetch()} />;

  async function runPreview() {
    let rows: unknown;
    try {
      rows = JSON.parse(rowsJson);
    } catch {
      rows = [];
    }
    await preview.mutateAsync({ rows, fileName: 'relief-systems-import.json' });
  }

  return (
    <div className="space-y-5">
      <PsiCard title="Import Relief Systems Design Basis" subtitle="Use the backend import template and preview validation before committing records. File upload can be routed through Document Control/storage when configured.">
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <h3 className="font-semibold">Template Fields</h3>
            <pre className="mt-3 max-h-96 overflow-auto rounded-lg bg-[var(--psm-surface-2)] p-3 text-xs">{JSON.stringify(template.data, null, 2)}</pre>
          </div>
          <div className="space-y-3">
            <textarea value={rowsJson} onChange={(e) => setRowsJson(e.target.value)} className="min-h-72 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-xs" />
            <PsiButton onClick={() => void runPreview()} disabled={preview.isPending} title={preview.isPending ? 'Import preview running.' : undefined}>{preview.isPending ? 'Previewing...' : 'Preview Import'}</PsiButton>
          </div>
        </div>
      </PsiCard>
      {preview.isError ? <PsiErrorState message={preview.error.message} /> : null}
      {preview.data ? <PsiCard title="Import Preview" subtitle="Backend validation results; rows with errors are not ready for import."><pre className="max-h-96 overflow-auto rounded-lg bg-[var(--psm-surface-2)] p-3 text-xs">{JSON.stringify(preview.data, null, 2)}</pre></PsiCard> : <PsiEmptyState title="No preview yet" message="Paste JSON rows or use the template output from your import workflow, then run preview." />}
    </div>
  );
}
