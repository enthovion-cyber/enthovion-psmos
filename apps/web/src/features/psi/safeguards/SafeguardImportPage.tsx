'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { safeguardService } from '../services/safeguard.service';
import { PsiButton, PsiCard, PsiEmptyState, PsiErrorState, PsiLoadingState } from '../shared/PsiUi';

export function SafeguardImportPage() {
  const template = useQuery({ queryKey: ['psi', 'safeguard-import-template'], queryFn: safeguardService.importTemplate });
  const [rowsText, setRowsText] = useState('');
  const preview = useMutation({ mutationFn: (input: Record<string, unknown>) => safeguardService.importPreview(input) });
  if (template.isLoading) return <PsiLoadingState rows={4} />;
  if (template.isError) return <PsiErrorState message={template.error.message} onRetry={() => void template.refetch()} />;
  const rows = rowsText.split('\n').map((line) => line.trim()).filter(Boolean).map((line) => {
    try { return JSON.parse(line); } catch { return { safeguard_title: line }; }
  });
  return <div className="space-y-5"><PsiCard title="Import Safeguards / Controls" subtitle="Paste one JSON row per line or a simple safeguard title per line for preview. Backend validates unit/site access, required fields, source/document scope, duplicate tags, errors, audit, and PSI history before commit.">
    <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-sm"><strong>Template columns:</strong> {Array.isArray(template.data?.columns) ? template.data.columns.join(', ') : 'Template unavailable'}</div>
    <textarea value={rowsText} onChange={(event) => setRowsText(event.target.value)} rows={8} className="mt-4 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 outline-none focus:border-primary" placeholder='{"unit_id":"...","safeguard_title":"High pressure shutdown","safeguard_type":"SIF / SIS","function_type":"Shutdown process","criticality":"Critical"}' />
    <div className="mt-3"><PsiButton onClick={() => preview.mutate({ rows, fileName: 'safeguards-import-preview.jsonl' })} disabled={!rows.length || preview.isPending} title={!rows.length ? 'Enter at least one row to preview.' : undefined}>{preview.isPending ? 'Validating...' : 'Validate Import Preview'}</PsiButton></div>
  </PsiCard>{preview.isError ? <PsiErrorState message={preview.error.message} /> : null}{preview.data ? <PsiCard title="Import Preview" subtitle="Row validation errors and warnings are backend-generated."><pre className="max-h-96 overflow-auto rounded-lg bg-[var(--psm-surface-2)] p-4 text-xs">{JSON.stringify(preview.data, null, 2)}</pre></PsiCard> : <PsiEmptyState title="No preview yet" message="Validate rows to see import errors, warnings, and job metadata." />}</div>;
}
