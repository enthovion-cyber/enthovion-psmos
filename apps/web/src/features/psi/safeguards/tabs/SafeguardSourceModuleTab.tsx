import type { SafeguardDetail } from '../../types/safeguard.types';
import { SafeguardSourceStatusPanel } from '../SafeguardSourceStatusPanel';
import { SafeguardListPanel } from '../SafeguardPrimitives';

export function SafeguardSourceModuleTab({ detail }: { detail: SafeguardDetail }) {
  return <div className="space-y-5"><SafeguardSourceStatusPanel sourceLinks={detail.sourceLinks} syncEvents={detail.syncEvents} /><SafeguardListPanel title="Source Module Links" subtitle="Linked module, record ID/tag, source/readiness/test/bypass/document status, verification dates, sync mode, and notes." rows={detail.sourceLinks} emptyTitle="No source links" emptyMessage="Use real source modules where available or a clearly labeled manual placeholder." /></div>;
}
