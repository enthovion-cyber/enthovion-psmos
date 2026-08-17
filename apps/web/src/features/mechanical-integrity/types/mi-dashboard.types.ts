import type { MiAttentionItem, MiDistributionPoint, MiEquipment, MiKpi } from './equipment.types';

export type MiDashboard = {
  header: {
    title: string;
    subtitle: string;
    activeSiteId?: string | null;
    lastUpdated: string;
  };
  kpis: MiKpi[];
  criticalAttention: MiAttentionItem[];
  charts: {
    byStatus: MiDistributionPoint[];
    byCriticality: MiDistributionPoint[];
    byType: MiDistributionPoint[];
    byFitness: MiDistributionPoint[];
    bySiteUnitArea: MiDistributionPoint[];
    inspectionDue: MiDistributionPoint[];
    deficiencySeverity: MiDistributionPoint[];
  };
  dueSoon: {
    inspections: MiEquipment[];
    pm: MiEquipment[];
    calibrations: MiEquipment[];
  };
  bypasses: MiEquipment[];
  deficiencies: MiEquipment[];
  recentActivity: Array<Record<string, unknown>>;
};
