'use client';

import { DetailCard, Metric } from '../moc-detail-ui';

export function MOCHistorySummaryCard({ summary }: { summary: any }) {
  return (
    <DetailCard title="History Summary">
      <div className="grid gap-3 md:grid-cols-5">
        <Metric label="Total Events" value={summary?.totalEvents ?? 0} tone="blue" />
        <Metric label="Safety Critical" value={summary?.safetyCriticalCount ?? 0} tone={(summary?.safetyCriticalCount ?? 0) ? 'red' : 'green'} />
        <Metric label="Categories" value={Object.keys(summary?.byCategory ?? {}).length} tone="slate" />
        <Metric label="Users" value={Object.keys(summary?.byUser ?? {}).length} tone="purple" />
        <Metric label="Last Event" value={summary?.lastEventAt ? new Date(summary.lastEventAt).toLocaleDateString() : '-'} tone="amber" />
      </div>
    </DetailCard>
  );
}
