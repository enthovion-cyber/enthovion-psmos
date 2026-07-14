'use client';

import { DetailCard, Metric } from '../moc-detail-ui';

export function MOCAttachmentSummaryCard({ summary }: { summary: any }) {
  return (
    <DetailCard title="Attachment Summary">
      <div className="grid gap-3 md:grid-cols-5">
        <Metric label="Total Files" value={summary?.totalAttachments ?? 0} tone="blue" />
        <Metric label="Total Size" value={formatBytes(summary?.totalSizeBytes ?? 0)} tone="slate" />
        <Metric label="Linked Docs" value={summary?.linkedDocumentCount ?? 0} tone="purple" />
        <Metric label="Safety Critical" value={summary?.safetyCriticalCount ?? 0} tone={(summary?.safetyCriticalCount ?? 0) ? 'red' : 'green'} />
        <Metric label="Latest Upload" value={summary?.lastUploadedAt ? new Date(summary.lastUploadedAt).toLocaleDateString() : '-'} tone="amber" />
      </div>
    </DetailCard>
  );
}

function formatBytes(bytes: number) {
  if (!bytes) return '0 KB';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, i)).toFixed(i ? 1 : 0)} ${units[i]}`;
}
