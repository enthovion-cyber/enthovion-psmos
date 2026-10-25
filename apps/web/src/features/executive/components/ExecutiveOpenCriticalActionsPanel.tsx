import type { ExecutiveAlert } from '../types/executive-kpi.types';
import { ExecutiveAlertListPanel } from './ExecutiveAlertListPanel';

export function ExecutiveOpenCriticalActionsPanel({ rows }: { rows: ExecutiveAlert[] }) {
  return <ExecutiveAlertListPanel title="Open Critical Actions" subtitle="Backend-derived overdue and critical action signals." rows={rows} />;
}
