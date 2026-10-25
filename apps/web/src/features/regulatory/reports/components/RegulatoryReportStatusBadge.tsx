import { RegulatoryBadge } from '../../shared/RegulatoryUi';

export function RegulatoryReportStatusBadge({ value }: { value?: string | null }) {
  const status = value ?? 'Not Determined';
  const tone = /approved|generated|current|ready|completed/i.test(status) ? 'good' : /failed|stale|archived|missing/i.test(status) ? 'danger' : /pending|queued|warning|draft/i.test(status) ? 'warn' : 'neutral';
  return <RegulatoryBadge tone={tone}>{status}</RegulatoryBadge>;
}
