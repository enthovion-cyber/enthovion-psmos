import type { ExecutiveAlert } from '../types/executive-kpi.types';
import { ExecutiveAlertListPanel } from './ExecutiveAlertListPanel';

export function ExecutiveStaleRecordsPanel({ rows }: { rows: ExecutiveAlert[] }) {
  return <ExecutiveAlertListPanel title="Stale Records" subtitle="Critical source records needing freshness or source review." rows={rows} />;
}
