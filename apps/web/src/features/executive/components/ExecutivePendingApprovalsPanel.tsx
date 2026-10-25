import type { ExecutiveAlert } from '../types/executive-kpi.types';
import { ExecutiveAlertListPanel } from './ExecutiveAlertListPanel';

export function ExecutivePendingApprovalsPanel({ rows }: { rows: ExecutiveAlert[] }) {
  return <ExecutiveAlertListPanel title="Pending Approvals" subtitle="Only configured approval-source records are included." rows={rows} />;
}
