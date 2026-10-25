'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  LayoutDashboard,
  Award,
  Layers,
  LineChart,
  AlertTriangle,
  CheckSquare,
  FileText,
  FileCheck2,
  GitBranch,
  History,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useExecutivePsmElementDetail } from '../hooks/useExecutivePsmElementDetail';
import { useMyPermissions } from '@/features/iam/hooks/useIam';
import { ExecutiveOverviewNavigation } from '../components/ExecutiveOverview';
import { ExecutivePsmElementHeader } from './ExecutivePsmElementHeader';
import { ExecutivePsmElementScoreFactorPanel } from './ExecutivePsmElementScoreFactorPanel';
import { PsmElementOverviewTab } from './tabs/PsmElementOverviewTab';
import { PsmElementScorecardTab } from './tabs/PsmElementScorecardTab';
import { PsmElementSourceModulesTab } from './tabs/PsmElementSourceModulesTab';
import { PsmElementKpisTab } from './tabs/PsmElementKpisTab';
import { PsmElementGapsTab } from './tabs/PsmElementGapsTab';
import { PsmElementActionsTab } from './tabs/PsmElementActionsTab';
import { PsmElementEvidenceTab } from './tabs/PsmElementEvidenceTab';
import { PsmElementApprovalsTab } from './tabs/PsmElementApprovalsTab';
import { PsmElementSourceTraceTab } from './tabs/PsmElementSourceTraceTab';
import { PsmElementHistoryTab } from './tabs/PsmElementHistoryTab';
import { RecalculatePsmElementDialog } from './dialogs/RecalculatePsmElementDialog';
import { CreatePsmElementSnapshotDialog } from './dialogs/CreatePsmElementSnapshotDialog';

export type PsmElementDetailTab =
  | 'overview'
  | 'scorecard'
  | 'source-modules'
  | 'kpis'
  | 'gaps'
  | 'actions'
  | 'evidence'
  | 'approvals'
  | 'source-trace'
  | 'history';

interface Props {
  id: string;
  view?: string;
}

const TAB_CONFIG: Array<{ id: PsmElementDetailTab; label: string; icon: React.ElementType }> = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'scorecard', label: 'Scorecard & Factors', icon: Award },
  { id: 'source-modules', label: 'Source Modules', icon: Layers },
  { id: 'kpis', label: 'Contributing KPIs', icon: LineChart },
  { id: 'gaps', label: 'Gaps & Deficiencies', icon: AlertTriangle },
  { id: 'actions', label: 'Remediation Actions', icon: CheckSquare },
  { id: 'evidence', label: 'Readiness & Evidence', icon: FileText },
  { id: 'approvals', label: 'Approvals & Governance', icon: FileCheck2 },
  { id: 'source-trace', label: 'Source Trace', icon: GitBranch },
  { id: 'history', label: 'History & Audits', icon: History },
];

export function ExecutivePsmElementDetailPage({ id, view = 'overview' }: Props) {
  const router = useRouter();
  const permissions = useMyPermissions();
  const granted = new Set(permissions.data ?? []);

  const [activeTab, setActiveTab] = useState<PsmElementDetailTab>(
    (TAB_CONFIG.some((t) => t.id === view) ? view : 'overview') as PsmElementDetailTab
  );

  const [recalcOpen, setRecalcOpen] = useState(false);
  const [snapshotOpen, setSnapshotOpen] = useState(false);

  const query = useExecutivePsmElementDetail(id);

  if (query.isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 animate-pulse rounded-lg bg-[var(--psm-surface-2)]" />
        <div className="h-32 animate-pulse rounded-xl bg-[var(--psm-surface-2)]" />
        <div className="h-12 animate-pulse rounded-xl bg-[var(--psm-surface-2)]" />
        <div className="h-96 animate-pulse rounded-xl bg-[var(--psm-surface-2)]" />
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <main className="space-y-6">
        <ExecutiveOverviewNavigation permissions={granted} />
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-rose-500" />
          <h2 className="mt-2 text-lg font-bold text-[var(--psm-text)]">PSM Element Not Found or Restricted</h2>
          <p className="mt-1 text-sm text-[var(--psm-muted)]">
            This PSM element may not exist, may be outside your current site scope, or requires additional executive permissions.
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <Link
              href="/executive/psm-elements/register"
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface)] px-4 py-2 text-xs font-semibold text-[var(--psm-text)]"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Register
            </Link>
            <button
              type="button"
              onClick={() => void query.refetch()}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--psm-primary)] px-4 py-2 text-xs font-semibold text-white"
            >
              <RefreshCw className="h-4 w-4" /> Retry
            </button>
          </div>
        </div>
      </main>
    );
  }

  const detail = query.data;

  const handleTabChange = (tabId: PsmElementDetailTab) => {
    setActiveTab(tabId);
    router.replace(`/executive/psm-elements/${id}/${tabId}`);
  };

  return (
    <main className="space-y-6">
      <ExecutiveOverviewNavigation permissions={granted} />

      {/* Back button */}
      <div>
        <Link
          href="/executive/psm-elements/register"
          className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--psm-primary)] hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to PSM Element Register
        </Link>
      </div>

      {/* Header */}
      <ExecutivePsmElementHeader
        detail={detail}
        onRefresh={() => setRecalcOpen(true)}
        onSnapshot={() => setSnapshotOpen(true)}
        refreshing={query.isFetching}
      />

      {/* Score Factor strip if on overview or scorecard */}
      {(activeTab === 'overview' || activeTab === 'scorecard') && detail.factors?.length > 0 && (
        <ExecutivePsmElementScoreFactorPanel factors={detail.factors} />
      )}

      {/* Tab Navigation */}
      <div className="flex gap-2 overflow-x-auto border-b border-[var(--psm-line)] pb-2">
        {TAB_CONFIG.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={`inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
                isActive
                  ? 'bg-[var(--psm-primary)] text-white shadow-sm'
                  : 'text-[var(--psm-muted)] hover:bg-[var(--psm-surface-2)] hover:text-[var(--psm-text)]'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab View Content */}
      <section>
        {activeTab === 'overview' && <PsmElementOverviewTab detail={detail} />}
        {activeTab === 'scorecard' && <PsmElementScorecardTab detail={detail} />}
        {activeTab === 'source-modules' && <PsmElementSourceModulesTab detail={detail} />}
        {activeTab === 'kpis' && <PsmElementKpisTab detail={detail} />}
        {activeTab === 'gaps' && <PsmElementGapsTab detail={detail} />}
        {activeTab === 'actions' && <PsmElementActionsTab detail={detail} />}
        {activeTab === 'evidence' && <PsmElementEvidenceTab detail={detail} />}
        {activeTab === 'approvals' && <PsmElementApprovalsTab detail={detail} />}
        {activeTab === 'source-trace' && <PsmElementSourceTraceTab detail={detail} />}
        {activeTab === 'history' && <PsmElementHistoryTab detail={detail} />}
      </section>

      {/* Recalculate Dialog */}
      <RecalculatePsmElementDialog
        open={recalcOpen}
        onOpenChange={setRecalcOpen}
        elementId={detail.element.id}
        elementName={detail.element.element_name}
      />

      {/* Snapshot Dialog */}
      <CreatePsmElementSnapshotDialog
        open={snapshotOpen}
        onOpenChange={setSnapshotOpen}
      />
    </main>
  );
}
