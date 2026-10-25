import type { ExecutiveKpiResult } from '../types/executive-kpi.types';
import { ExecutiveKpiGroupPanel } from './ExecutiveKpiGroupPanel';

export function ExecutiveIncidentMiTrainingSummary({ rows }: { rows: ExecutiveKpiResult[] }) {
  return <ExecutiveKpiGroupPanel title="Incident, MI & Training" subtitle="Operational risk, integrity, and competency signals." rows={rows} />;
}
