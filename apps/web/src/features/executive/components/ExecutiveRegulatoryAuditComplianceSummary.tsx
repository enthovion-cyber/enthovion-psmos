import type { ExecutiveKpiResult } from '../types/executive-kpi.types';
import { ExecutiveKpiGroupPanel } from './ExecutiveKpiGroupPanel';

export function ExecutiveRegulatoryAuditComplianceSummary({ rows }: { rows: ExecutiveKpiResult[] }) {
  return <ExecutiveKpiGroupPanel title="Regulatory, Audit & Compliance" subtitle="Configured compliance signals from permitted source adapters." rows={rows} />;
}
