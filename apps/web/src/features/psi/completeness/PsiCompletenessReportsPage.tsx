'use client';

import { useQuery } from '@tanstack/react-query';
import { psiCompletenessService } from '../services/psi-completeness.service';
import { PsiButton, PsiCard, PsiErrorState, PsiLoadingState } from '../shared/PsiUi';
import { PsiCompletenessHeader } from './PsiCompletenessHeader';

export function PsiCompletenessReportsPage() {
  const reports = useQuery({ queryKey: ['psi', 'completeness', 'reports'], queryFn: () => psiCompletenessService.reports() });
  const generate = useQuery({ queryKey: ['psi', 'completeness', 'reports', 'preview'], queryFn: () => psiCompletenessService.generateReport({ reportType: 'PSI completeness report' }), enabled: false });
  if (reports.isLoading) return <PsiLoadingState rows={4} />;
  if (reports.isError) return <PsiErrorState message="Completeness reports could not be loaded." onRetry={() => reports.refetch()} />;
  const available = (reports.data?.availableReports as string[] | undefined) ?? [];
  return <div className="space-y-5"><PsiCompletenessHeader title="Completeness Reports" subtitle="Audit-ready PSI completeness package, management summary, PSSR readiness package, gap report, and MOC-required report." /><PsiCard title="Available Reports" action={<PsiButton onClick={() => generate.refetch()} disabled={generate.isFetching}>{generate.isFetching ? 'Generating...' : 'Generate Report'}</PsiButton>}><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{available.map((report) => <div key={report} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4"><p className="font-semibold">{report}</p><p className="mt-1 text-sm text-[var(--psm-muted)]">Generated from backend completeness, gap, waiver, run, and score data.</p></div>)}</div></PsiCard></div>;
}
