'use client';

import { useState } from 'react';
import { useMiReports } from '../hooks/useMiReports';
import { CommonReportsGrid } from './CommonReportsGrid';
import { CustomReportBuilder } from './CustomReportBuilder';
import { GenerateReportDialog } from './GenerateReportDialog';
import { GeneratedReportsTable } from './GeneratedReportsTable';
import { MiReportsHeader } from './MiReportsHeader';
import { ReportCategoryCards } from './ReportCategoryCards';
import { ReportPreviewPanel } from './ReportPreviewPanel';
import { ReportTemplateTable } from './ReportTemplateTable';
import { ScheduledReportsTable } from './ScheduledReportsTable';

export function MiReportsDashboardPage({ moduleFilter }: { moduleFilter?: string }) {
  const query = useMiReports(moduleFilter ? { module: moduleFilter } : {});
  const [selectedType, setSelectedType] = useState<string>();

  if (query.isLoading) return <div className="p-6"><div className="h-32 animate-pulse rounded-xl bg-[var(--psm-muted-bg)]" /></div>;
  if (query.error) return <div className="m-6 rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-700 dark:text-red-200">Unable to load MI reports. Check permissions and backend availability.</div>;

  return (
    <main className="space-y-5 p-4 lg:p-6">
      <MiReportsHeader lastUpdated={query.data?.lastUpdated} onRefresh={() => void query.refetch()} />
      <ReportCategoryCards categories={query.data?.categories} />
      <GenerateReportDialog reportType={selectedType} />
      <CommonReportsGrid reports={query.data?.commonReports} onGenerate={setSelectedType} />
      <ReportPreviewPanel summary={query.data?.summary} />
      <CustomReportBuilder />
      <ReportTemplateTable rows={query.data?.templates} />
      <GeneratedReportsTable rows={query.data?.generated} />
      <ScheduledReportsTable rows={query.data?.scheduled} />
    </main>
  );
}
