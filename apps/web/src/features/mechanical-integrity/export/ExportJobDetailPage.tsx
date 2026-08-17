'use client';

import { useQuery } from '@tanstack/react-query';
import { miExportService } from '../services/mi-export.service';
import { ExportJobsTable } from './ExportJobsTable';

export function ExportJobDetailPage({ jobId }: { jobId: string }) {
  const query = useQuery({ queryKey: ['mechanical-integrity', 'export-job', jobId], queryFn: () => miExportService.job(jobId) });
  if (query.isLoading) return <div className="p-6">Loading export job...</div>;
  if (query.error || !query.data) return <div className="m-6 rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-700 dark:text-red-200">Export job not found or access denied.</div>;
  return <main className="space-y-5 p-4 lg:p-6"><ExportJobsTable rows={[query.data.row]} /><pre className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 text-xs">{JSON.stringify(query.data.preview ?? [], null, 2)}</pre></main>;
}
