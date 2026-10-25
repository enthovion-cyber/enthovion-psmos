import { RegulatoryMetricCard } from '../../shared/RegulatoryUi';

export function RegulatoryReportSummaryCards({ summary }: { summary?: Record<string, number> }) {
  const cards: Array<[string, string, 'neutral' | 'good' | 'warn' | 'danger']> = [
    ['Total reports', 'totalReports', 'neutral'], ['Generated', 'generatedReports', 'good'], ['Pending approval', 'pendingApproval', 'warn'], ['Stale', 'staleReports', 'danger'], ['Generation failed', 'generationFailed', 'danger'], ['Locked', 'lockedReports', 'neutral'], ['Missing evidence', 'reportsWithMissingEvidence', 'warn'], ['Open CAPA', 'reportsWithOpenCapa', 'warn']
  ];
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label, key, tone]) => <RegulatoryMetricCard key={key} label={label} value={summary?.[key] ?? 0} tone={tone} />)}</div>;
}
