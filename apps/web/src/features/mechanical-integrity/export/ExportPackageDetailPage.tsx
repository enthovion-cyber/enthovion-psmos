'use client';

import { useQuery } from '@tanstack/react-query';
import { miExportService } from '../services/mi-export.service';
import { ExportPackageTable } from './ExportPackageTable';

export function ExportPackageDetailPage({ packageId }: { packageId: string }) {
  const query = useQuery({ queryKey: ['mechanical-integrity', 'export-package', packageId], queryFn: () => miExportService.packageDetail(packageId) });
  if (query.isLoading) return <div className="p-6">Loading export package...</div>;
  if (query.error || !query.data) return <div className="m-6 rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-700 dark:text-red-200">Export package not found or access denied.</div>;
  return <main className="space-y-5 p-4 lg:p-6"><ExportPackageTable rows={[query.data.row]} /><pre className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 text-xs">{JSON.stringify(query.data.items ?? [], null, 2)}</pre></main>;
}
