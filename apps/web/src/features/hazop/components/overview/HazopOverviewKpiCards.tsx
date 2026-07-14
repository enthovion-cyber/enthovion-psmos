'use client';

import { AlertTriangle, CheckCircle2, ClipboardList, FileText, GitBranch, Layers3, Link2, Paperclip, ShieldAlert, Users } from 'lucide-react';
import { HazopMetricCard } from './HazopMetricCard';
import type { HazopOverviewKpi } from '../../types/hazop-overview.types';

const iconMap: Record<string, any> = {
  nodes: Layers3,
  scenarios: ClipboardList,
  highCritical: AlertTriangle,
  openRecommendations: FileText,
  iplGaps: ShieldAlert,
  sessionsCompleted: CheckCircle2,
  pendingSignoffs: Users,
  linkedRecords: Link2,
  attachments: Paperclip,
  openActions: GitBranch
};

export function HazopOverviewKpiCards({ kpis, onNavigate }: { kpis: HazopOverviewKpi[]; onNavigate: (tab?: string) => void }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {kpis.map((kpi) => <HazopMetricCard key={kpi.key} icon={iconMap[kpi.key] ?? ClipboardList} label={kpi.label} value={kpi.value} helper={kpi.helper} tone={kpi.tone} onClick={() => onNavigate(kpi.tab)} />)}
    </div>
  );
}
