'use client';

import { useQuery } from '@tanstack/react-query';
import { trainingMatrixService } from '../services/training-matrix.service';
import { TrainingCard, TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';
import { TrainingMatrixHeader } from './TrainingMatrixHeader';

export function TrainingMatrixImportPage() {
  const query = useQuery({ queryKey: ['training-matrix-import-template'], queryFn: () => trainingMatrixService.importTemplate() });
  if (query.isLoading) return <TrainingLoadingState rows={3} />;
  if (query.isError) return <TrainingErrorState message={query.error.message} onRetry={() => query.refetch()} />;
  return <div className="space-y-5"><TrainingMatrixHeader title="Training Matrix Import" subtitle="CSV/XLSX import foundation with row validation, duplicate checks, scope checks, and audit/history." /><TrainingCard title="Import Template Columns" subtitle="Use these columns for matrix rule import. Commit is blocked if validation finds row errors."><div className="grid gap-2 md:grid-cols-3">{(query.data?.columns ?? []).map((col: string) => <code key={col} className="rounded bg-[var(--psm-surface-2)] px-2 py-1 text-xs">{col}</code>)}</div></TrainingCard><TrainingCard title="Upload Import File"><p className="text-sm text-[var(--psm-muted)]">Storage-backed file upload/import UI is a later enhancement. This page exposes the backend validation contract and safe template; no mock import data is displayed.</p></TrainingCard></div>;
}
