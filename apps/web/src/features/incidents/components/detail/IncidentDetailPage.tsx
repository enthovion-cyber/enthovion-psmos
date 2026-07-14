'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useIncidentDetail, useIncidentDetailMutations } from '../../hooks/useIncidentDetail';
import { ActualSeverityBadge } from '../shared/ActualSeverityBadge';
import { IncidentClassificationBadge } from '../shared/IncidentClassificationBadge';
import { Badge, IncidentStatusBadge } from '../shared/IncidentStatusBadge';
import { InvestigationPriorityBadge } from '../shared/InvestigationPriorityBadge';
import { PotentialSeverityBadge } from '../shared/PotentialSeverityBadge';
import { PseTierBadge } from '../shared/PseTierBadge';
import { PsmIncidentBadge } from '../shared/PsmIncidentBadge';
import { IncidentOverviewTab } from '../overview/IncidentOverviewTab';
import { AssetEquipmentChemicalTab } from './AssetEquipmentChemicalTab';
import { BarrierSafeguardFailureTab } from './BarrierSafeguardFailureTab';
import { CorrectivePreventiveActionsTab } from './CorrectivePreventiveActionsTab';
import { EvidenceAttachmentsTab } from './EvidenceAttachmentsTab';
import { FinalReportExportTab } from './FinalReportExportTab';
import { ImmediateActionsTab } from './ImmediateActionsTab';
import { EventDetailsClassificationTab } from './EventDetailsClassificationTab';
import { IncidentHistoryTab } from './IncidentHistoryTab';
import { InvestigationTeamTab } from './InvestigationTeamTab';
import { LessonsLearnedTab } from './LessonsLearnedTab';
import { LinkedRecordsTab } from './LinkedRecordsTab';
import { NotificationsRegulatoryReportingTab } from './NotificationsRegulatoryReportingTab';
import { PeopleInjuryExposureTab } from './PeopleInjuryExposureTab';
import { PotentialSeverityRiskMatrixTab } from './PotentialSeverityRiskMatrixTab';
import { ReviewApprovalTab } from './ReviewApprovalTab';
import { RootCauseAnalysisTab } from './RootCauseAnalysisTab';
import { TimelineTab } from './TimelineTab';

export function IncidentDetailPage({ id }: { id: string }) {
  const [selectedTab, setSelectedTab] = useState(initialIncidentTab);
  const { data, isLoading, error, refetch } = useIncidentDetail(id);
  const mutations = useIncidentDetailMutations(id);
  const [statusReason, setStatusReason] = useState('');

  const activeTab = useMemo(() => data?.tabs?.tabs?.find((tab) => tab.key === selectedTab) ?? data?.tabs?.tabs?.[0], [data, selectedTab]);
  const activeTabKey = activeTab?.key ?? selectedTab;

  const selectTab = useCallback((tabKey: string, mode: 'push' | 'replace' = 'push') => {
    setSelectedTab(tabKey);
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tabKey);
    const historyMethod = mode === 'replace' ? 'replaceState' : 'pushState';
    window.history[historyMethod]({ ...window.history.state, incidentTab: tabKey }, '', `${url.pathname}${url.search}${url.hash}`);
  }, []);

  useEffect(() => {
    const handlePopState = () => setSelectedTab(currentIncidentTab());
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const handleIncidentTabSelect = (event: Event) => {
      const tabKey = (event as CustomEvent<{ tabKey?: string }>).detail?.tabKey;
      if (tabKey) selectTab(tabKey);
    };
    window.addEventListener('incident:select-tab', handleIncidentTabSelect);
    return () => window.removeEventListener('incident:select-tab', handleIncidentTabSelect);
  }, [selectTab]);

  useEffect(() => {
    if (!data?.tabs?.tabs?.length) return;
    const exists = data.tabs.tabs.some((tab: any) => tab.key === selectedTab);
    const fallbackTabKey = data.tabs.tabs[0]?.key;
    if (!exists && fallbackTabKey) selectTab(fallbackTabKey, 'replace');
  }, [data?.tabs?.tabs, selectTab, selectedTab]);

  if (isLoading) return <ShellState title="Loading incident investigation" message="Loading the incident detail shell, permissions, overview, and readiness." />;
  if (error) return <ShellState title="Could not load incident" message={error instanceof Error ? error.message : 'The incident detail API returned an error.'} tone="danger" />;
  if (!data) return <ShellState title="Incident not found" message="No incident data was returned for this route." tone="danger" />;

  const header = data.header;
  const actions = data.quickActions ?? header.actions ?? [];

  const runAction = async (action: any) => {
    if (!action.enabled) return;
    if (action.key === 'refresh') return refetch();
    if (action.key === 'export-summary') return mutations.exportSummary.mutate();
    if (action.key === 'close') return mutations.close.mutate({ reason: statusReason || 'Closed from detail shell' });
    if (action.key === 'reopen') return mutations.reopen.mutate({ reason: statusReason || 'Reopened from detail shell' });
    if (action.key === 'assign-owner') {
      const ownerId = window.prompt('Enter the IAM/RBAC user ID for the investigation owner.');
      if (ownerId) return mutations.assignOwner.mutate({ ownerId, reason: statusReason || 'Assigned from incident detail shell' });
      return;
    }
    if (action.key === 'change-status') {
      const status = window.prompt('Enter the next incident status.');
      if (status) return mutations.changeStatus.mutate({ status, reason: statusReason || 'Status changed from incident detail shell' });
      return;
    }
    const tabByAction: Record<string, string> = {
      'edit-basic': 'event-details',
      'create-action': 'capa',
      'upload-evidence': 'evidence',
      'psm-review': 'notifications',
      'severity-review': 'potential-severity'
    };
    const targetTab = tabByAction[action.key];
    if (targetTab) selectTab(targetTab);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-[#03111f] dark:text-slate-100">
      <div className="mx-auto flex max-w-[1900px] flex-col gap-4 px-4 py-4">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          {(header.breadcrumbs ?? []).map((crumb: any, index: number) => <span key={crumb.href ?? crumb.label}>{index ? '/' : ''} <a className="hover:text-blue-500" href={crumb.href}>{crumb.label}</a></span>)}
        </div>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-cyan-300/10 dark:bg-[#071525] dark:shadow-none">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-slate-950 dark:text-white">{header.incidentNumber}</h1>
                <IncidentStatusBadge status={header.status} />
                <IncidentClassificationBadge value={header.classification} />
                <PseTierBadge value={header.apiRp754Tier} />
                {header.restricted || header.confidential ? <Badge value={header.restricted ? 'Restricted' : 'Confidential'} /> : null}
                {header.locked ? <Badge value="Read-only" map={{ 'Read-only': 'slate' }} /> : null}
              </div>
              <h2 className="mt-2 text-lg font-bold text-slate-900 dark:text-slate-100">{header.title}</h2>
              <p className="mt-1 max-w-5xl text-sm text-slate-500 dark:text-slate-400">{header.shortDescription}</p>
              <div className="mt-3 grid gap-2 text-xs text-slate-600 dark:text-slate-300 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
                <Fact label="Site" value={header.site?.name ?? header.site?.code ?? '-'} />
                <Fact label="Unit" value={header.unit?.name ?? '-'} />
                <Fact label="Area" value={header.area?.name ?? '-'} />
                <Fact label="Location" value={header.location ?? '-'} />
                <Fact label="Event date/time" value={formatDate(header.eventDateTime)} />
                <Fact label="Owner" value={header.investigationOwner?.displayName ?? '-'} />
                <Fact label="Due date" value={header.dueDate ?? '-'} />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap justify-start gap-2 xl:justify-end">
                <ActualSeverityBadge value={header.actualSeverity} />
                <PotentialSeverityBadge value={header.potentialSeverity} />
                <InvestigationPriorityBadge value={header.investigationPriority} />
                <PsmIncidentBadge value={header.isPsmIncident} />
                <Badge value={header.isProcessSafetyEvent ? 'PSE Yes' : 'PSE No'} />
              </div>
              <div className="flex flex-wrap gap-2 xl:justify-end">
                {actions.map((action: any) => (
                  <button key={action.key} title={action.disabledReason ?? action.label} disabled={!action.enabled || mutations.close.isPending || mutations.reopen.isPending || mutations.exportSummary.isPending} onClick={() => runAction(action)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold hover:border-blue-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-cyan-300/10 dark:bg-[#0b1b2d]">
                    {action.label}
                  </button>
                ))}
              </div>
              <input value={statusReason} onChange={(event) => setStatusReason(event.target.value)} placeholder="Reason for close/reopen/status actions" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none dark:border-cyan-300/10 dark:bg-[#03111f]" />
            </div>
          </div>
        </section>

        <BannerList banners={header.banners ?? []} />
        <IncidentStatusBar statusBar={data.statusBar} />
        <IncidentTabs tabs={data.tabs?.tabs ?? []} selected={activeTabKey} onSelect={selectTab} />

        {activeTab?.key === 'overview' ? (
          <IncidentOverviewTab incidentId={id} overview={data.overview} actions={actions} />
        ) : activeTab?.key === 'event-details' ? (
          <EventDetailsClassificationTab incidentId={id} />
        ) : activeTab?.key === 'potential-severity' ? (
          <PotentialSeverityRiskMatrixTab incidentId={id} />
        ) : activeTab?.key === 'people' ? (
          <PeopleInjuryExposureTab incidentId={id} />
        ) : activeTab?.key === 'asset-chemical' ? (
          <AssetEquipmentChemicalTab incidentId={id} />
        ) : activeTab?.key === 'timeline' ? (
          <TimelineTab incidentId={id} />
        ) : activeTab?.key === 'evidence' ? (
          <EvidenceAttachmentsTab incidentId={id} />
        ) : activeTab?.key === 'immediate-actions' ? (
          <ImmediateActionsTab incidentId={id} />
        ) : activeTab?.key === 'investigation-team' ? (
          <InvestigationTeamTab incidentId={id} />
        ) : activeTab?.key === 'rca' ? (
          <RootCauseAnalysisTab incidentId={id} />
        ) : activeTab?.key === 'barrier-failure' ? (
          <BarrierSafeguardFailureTab incidentId={id} />
        ) : activeTab?.key === 'capa' ? (
          <CorrectivePreventiveActionsTab incidentId={id} />
        ) : activeTab?.key === 'linked-records' ? (
          <LinkedRecordsTab incidentId={id} />
        ) : activeTab?.key === 'notifications' ? (
          <NotificationsRegulatoryReportingTab incidentId={id} />
        ) : activeTab?.key === 'review' ? (
          <ReviewApprovalTab incidentId={id} />
        ) : activeTab?.key === 'lessons-learned' ? (
          <LessonsLearnedTab incidentId={id} />
        ) : activeTab?.key === 'history' ? (
          <IncidentHistoryTab incidentId={id} />
        ) : activeTab?.key === 'final-report' ? (
          <FinalReportExportTab incidentId={id} />
        ) : (
          <NotBuiltTab tab={activeTab} />
        )}
      </div>
    </div>
  );
}

function IncidentStatusBar({ statusBar }: { statusBar: any }) {
  const statuses = statusBar?.statuses ?? [];
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-cyan-300/10 dark:bg-[#071525]">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-black">Incident Status Bar</h2>
          <p className="text-xs text-slate-500">Current: {statusBar?.currentStatus} · Next recommended: {statusBar?.nextRecommendedStatus ?? '-'}</p>
        </div>
        <Badge value={statusBar?.workflowBlockers?.length ? `${statusBar.workflowBlockers.length} blockers` : 'No workflow blockers'} />
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {statuses.map((status: string) => <div key={status} className={`min-w-[130px] rounded-lg border px-3 py-2 text-xs ${status === statusBar?.currentStatus ? 'border-blue-400 bg-blue-500/10 text-blue-700 dark:text-blue-200' : 'border-slate-200 text-slate-500 dark:border-cyan-300/10'}`}>{status}</div>)}
      </div>
      {statusBar?.reason ? <p className="mt-2 text-xs text-slate-500">Last reason/comment: {statusBar.reason}</p> : null}
    </section>
  );
}

function IncidentTabs({ tabs, selected, onSelect }: { tabs: any[]; selected: string; onSelect: (tabKey: string) => void }) {
  return (
    <nav className="flex gap-2 overflow-x-auto rounded-xl border border-slate-200 bg-white p-2 dark:border-cyan-300/10 dark:bg-[#071525]" aria-label="Incident detail tabs">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          aria-current={selected === tab.key ? 'page' : undefined}
          onClick={() => onSelect(tab.key)}
          className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold transition-colors ${selected === tab.key ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-cyan-300/10'}`}
        >
          {tab.label} <span className={`ml-1 rounded px-1.5 py-0.5 text-[10px] ${tab.blocker ? 'bg-amber-500/15 text-amber-600 dark:text-amber-200' : 'bg-slate-500/10 text-slate-500'}`}>{tab.status}</span>
        </button>
      ))}
    </nav>
  );
}

function BannerList({ banners }: { banners: any[] }) {
  if (!banners.length) return null;
  return <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">{banners.map((banner, index) => <div key={`${banner.title}-${index}`} className={`rounded-xl border p-3 text-xs ${banner.type === 'danger' ? 'border-red-400/25 bg-red-500/10 text-red-700 dark:text-red-200' : banner.type === 'restricted' ? 'border-purple-400/25 bg-purple-500/10 text-purple-700 dark:text-purple-200' : 'border-amber-400/25 bg-amber-500/10 text-amber-700 dark:text-amber-200'}`}><b>{banner.title}</b><div className="mt-1 opacity-80">{banner.message}</div></div>)}</div>;
}

function NotBuiltTab({ tab }: { tab: any }) {
  return <section className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-cyan-300/10 dark:bg-[#071525]"><h2 className="text-lg font-black">{tab?.label ?? 'Unavailable tab'}</h2><p className="mt-2 text-sm text-slate-500">This tab key is not available in the current Incident detail shell response. No placeholder investigation data is shown.</p><p className="mt-2 text-xs text-slate-500">Current backend status: {tab?.status ?? 'Unavailable'}</p></section>;
}

function ShellState({ title, message, tone = 'info' }: { title: string; message: string; tone?: 'info' | 'danger' }) {
  return <div className="min-h-screen bg-slate-50 p-6 dark:bg-[#03111f]"><div className={`rounded-xl border p-6 ${tone === 'danger' ? 'border-red-400/25 bg-red-500/10 text-red-700 dark:text-red-200' : 'border-slate-200 bg-white text-slate-700 dark:border-cyan-300/10 dark:bg-[#071525] dark:text-slate-200'}`}><h1 className="text-lg font-black">{title}</h1><p className="mt-2 text-sm">{message}</p></div></div>;
}

function Fact({ label, value }: { label: string; value: any }) {
  return <div><div className="text-[10px] uppercase tracking-wide text-slate-400">{label}</div><div className="font-semibold">{value}</div></div>;
}

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString() : '-';
}

function initialIncidentTab() {
  return currentIncidentTab();
}

function currentIncidentTab() {
  if (typeof window === 'undefined') return 'overview';
  return new URLSearchParams(window.location.search).get('tab') ?? 'overview';
}
