'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { safeOperatingLimitService } from '../services/safe-operating-limit.service';
import { PsiButton, PsiCard, PsiErrorState, PsiLoadingState } from '../shared/PsiUi';

export function SafeOperatingLimitImportPage() {
  const template = useQuery({ queryKey: ['psi', 'safe-operating-limit-import-template'], queryFn: safeOperatingLimitService.importTemplate });
  const [rowsText, setRowsText] = useState('');
  const mutation = useMutation({ mutationFn: (input: Record<string, unknown>) => safeOperatingLimitService.importPreview(input) });
  if (template.isLoading) return <PsiLoadingState rows={4} />;
  if (template.isError) return <PsiErrorState message={template.error.message} onRetry={() => void template.refetch()} />;
  return (
    <div className="space-y-5">
      <div><p className="text-xs font-semibold uppercase tracking-wide text-primary">Safe Operating Limits</p><h1 className="mt-1 text-2xl font-bold">Import SOL Records</h1><p className="mt-2 text-sm text-[var(--psm-muted)]">Validate XLSX/CSV rows before commit. Unit/equipment scope, critical fields, conflicts, and conversion warnings are checked by backend.</p></div>
      <PsiCard title="Import Template Columns" subtitle="Use these columns for CSV/XLSX import.">{<div className="flex flex-wrap gap-2">{(template.data?.columns as string[] | undefined)?.map((column) => <span key={column} className="rounded-full border border-[var(--psm-line)] px-2 py-1 text-xs">{column}</span>)}</div>}</PsiCard>
      <PsiCard title="Preview Rows" subtitle="Paste parsed CSV/XLSX rows as JSON to validate with backend import preview. No data is committed from this preview step."><textarea value={rowsText} onChange={(e) => setRowsText(e.target.value)} placeholder="Paste parsed import rows JSON here." className="min-h-44 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-sm" /><div className="mt-3"><PsiButton onClick={() => { try { mutation.mutate({ rows: rowsText.trim() ? JSON.parse(rowsText) : [], fileName: 'safe-operating-limits-import.csv' }); } catch { mutation.mutate({ rows: [], fileName: 'invalid.json' }); } }} disabled={mutation.isPending}>{mutation.isPending ? 'Validating...' : 'Validate Import'}</PsiButton></div>{mutation.data ? <pre className="mt-3 max-h-96 overflow-auto rounded-lg bg-[var(--psm-surface-2)] p-3 text-xs">{JSON.stringify(mutation.data, null, 2)}</pre> : null}</PsiCard>
    </div>
  );
}
