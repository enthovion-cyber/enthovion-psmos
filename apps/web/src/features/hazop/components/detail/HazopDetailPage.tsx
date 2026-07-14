'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { useParams } from 'next/navigation';
import { Activity, AlertTriangle, ClipboardList, GitBranch, Plus } from 'lucide-react';
import { useHazopMutations, useHazopStudy } from '../../hooks/useHazop';
import { HazopNodesDeviationsTab } from './HazopNodesDeviationsTab';
import { HazopRecommendationsTab } from './HazopRecommendationsTab';
import { HazopRiskRankingTab } from './HazopRiskRankingTab';
import { HazopSafeguardsIplTab } from './HazopSafeguardsIplTab';
import { HazopTeamSessionsTab } from './HazopTeamSessionsTab';
import { HazopLinkedRecordsTab } from './HazopLinkedRecordsTab';
import { HazopReviewSignoffTab } from './HazopReviewSignoffTab';
import { HazopAttachmentsTab } from './HazopAttachmentsTab';
import { HazopHistoryTab } from './HazopHistoryTab';
import { HazopOverviewTab } from './HazopOverviewTab';
import { HazopStudyHeader } from './HazopStudyHeader';
import { HazopDetailTabs } from './HazopDetailTabs';
import type { HazopNodesInitialAction } from './HazopNodesDeviationsTab';
import { HazopStatusBadge, RiskBadge } from '../shared/HazopBadges';

export function HazopDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const studyQuery = useHazopStudy(id);
  const mutations = useHazopMutations(id);
  const [activeTab, setActiveTab] = useState('Overview');
  const [nodesAction, setNodesAction] = useState<HazopNodesInitialAction>(null);
  const study = studyQuery.data;

  if (studyQuery.isLoading) return <div className="min-h-screen bg-[var(--psm-bg)] p-6 text-[var(--psm-muted)]">Loading HAZOP study...</div>;
  if (studyQuery.isError || !study) return <div className="min-h-screen bg-[var(--psm-bg)] p-6 text-red-300">Unable to load HAZOP study from API.</div>;

  const lifecycle = (action: string, body?: Record<string, any>) => mutations.transition.mutate(body === undefined ? { action } : { action, body });
  const openNodesAction = (type: NonNullable<HazopNodesInitialAction>['type']) => {
    setActiveTab('Nodes & Deviations');
    setNodesAction({ type, nonce: Date.now() });
  };
  return (
    <div className="min-h-screen bg-[var(--psm-bg)] p-4 text-[var(--psm-text)] lg:p-6">
      <div className="space-y-4">
        <HazopStudyHeader
          study={study}
          onAction={{
            edit: () => setActiveTab('Overview'),
            addNode: () => openNodesAction('add-node'),
            addScenario: () => openNodesAction('add-scenario'),
            addRecommendation: () => openNodesAction('add-recommendation'),
            generateActions: () => setActiveTab('Recommendations / Actions'),
            requestApproval: () => lifecycle('request-approval'),
            approve: () => lifecycle('approve'),
            reject: () => lifecycle('review/reject', { reason: 'Rejected from HAZOP header' }),
            returnForRework: () => lifecycle('review/return-for-rework', { reason: 'Returned for rework from HAZOP header' }),
            closeStudy: () => lifecycle('close'),
            reopenStudy: () => lifecycle('reopen', { reason: 'Reopened from HAZOP header' }),
            exportReport: () => window.print(),
            uploadAttachment: () => setActiveTab('Attachments'),
            more: (action) => {
              if (action === 'history' || action === 'audit') setActiveTab('History');
              if (action === 'sync-linked-records') setActiveTab('Linked Records');
              if (action === 'recalculate-risk') setActiveTab('Risk Ranking');
              if (action === 'recalculate-readiness' || action === 'approval-package') setActiveTab('Review & Sign-Off');
              if (action === 'generate-final-report') window.print();
              if (action === 'cancel') lifecycle('cancel');
            }
          }}
        />
        <HazopDetailTabs activeTab={activeTab} onChange={setActiveTab} />
        <main className="min-w-0">
            {activeTab === 'Overview' ? <HazopOverviewTab study={study} onNavigate={(tab) => tab && setActiveTab(tab)} /> : null}
            {activeTab === 'Nodes & Deviations' ? <HazopNodesDeviationsTab study={study} initialAction={nodesAction} /> : null}
            {activeTab === 'Risk Ranking' ? <HazopRiskRankingTab study={study} /> : null}
            {activeTab === 'Safeguards / IPL' ? <HazopSafeguardsIplTab study={study} /> : null}
            {activeTab === 'Recommendations / Actions' ? <HazopRecommendationsTab study={study} /> : null}
            {activeTab === 'Team & Sessions' ? <HazopTeamSessionsTab study={study} /> : null}
            {activeTab === 'Linked Records' ? <HazopLinkedRecordsTab study={study} /> : null}
            {activeTab === 'Review & Sign-Off' ? <HazopReviewSignoffTab study={study} /> : null}
            {activeTab === 'History' ? <HazopHistoryTab study={study} /> : null}
            {activeTab === 'Attachments' ? <HazopAttachmentsTab study={study} /> : null}
        </main>
      </div>
    </div>
  );
}

function WorksheetTab({ study, onRowClick, onAddScenario }: { study: any; onRowClick: (scenario: any) => void; onAddScenario: (values: Record<string, any>) => void }) {
  return <div className="space-y-4"><AddScenarioForm nodes={study.nodes ?? []} onSubmit={onAddScenario} /><div className="overflow-x-auto rounded-xl border border-[var(--psm-line)]"><table className="w-full min-w-[1200px] text-sm"><thead className="bg-[var(--psm-surface-2)] text-xs uppercase text-[var(--psm-muted)]"><tr>{['Node', 'Guideword', 'Parameter', 'Deviation', 'Cause', 'Consequence', 'Safeguards', 'Risk', 'Recommendation', 'LOPA', 'Status'].map((head) => <th key={head} className="px-3 py-3 text-left">{head}</th>)}</tr></thead><tbody>{(study.scenarios ?? []).map((scenario: any) => { const node = (study.nodes ?? []).find((n: any) => n.id === scenario.node_id); const deviation = (study.deviations ?? []).find((d: any) => d.id === scenario.deviation_id); const recommendation = (study.recommendations ?? []).find((r: any) => r.scenario_id === scenario.id); return <tr key={scenario.id} onClick={() => onRowClick(scenario)} className="cursor-pointer border-t border-[var(--psm-line)] hover:bg-[var(--psm-surface-2)]"><td className="px-3 py-3">{node?.node_number ?? '-'}</td><td className="px-3 py-3">{deviation?.guideword ?? '-'}</td><td className="px-3 py-3">{deviation?.parameter ?? '-'}</td><td className="px-3 py-3">{deviation?.deviation ?? '-'}</td><td className="px-3 py-3">{scenario.cause}</td><td className="px-3 py-3">{scenario.consequence}</td><td className="px-3 py-3">{scenario.existing_safeguards ?? '-'}</td><td className="px-3 py-3"><RiskBadge value={scenario.risk_level} /></td><td className="px-3 py-3">{recommendation?.recommendation_number ?? (scenario.recommendation_required ? 'Required' : '-')}</td><td className="px-3 py-3">{scenario.lopa_required ? 'Yes' : 'No'}</td><td className="px-3 py-3">{scenario.status}</td></tr>; })}</tbody></table></div>{!(study.scenarios ?? []).length ? <Empty text="No scenarios yet. Add the first node scenario above." /> : null}</div>;
}

function SafeguardsTab({ study }: { study: any }) {
  return <div className="space-y-3">{(study.scenarios ?? []).map((scenario: any) => <div key={scenario.id} className="rounded-xl border border-[var(--psm-line)] p-4"><div className="flex items-center justify-between"><span className="font-semibold">{scenario.scenario_number}</span><span className="text-sm text-[var(--psm-muted)]">LOPA: {scenario.lopa_required ? 'Required' : 'Not required'}</span></div><p className="mt-2 text-sm">{scenario.existing_safeguards ?? 'No safeguards captured yet.'}</p></div>)}</div>;
}

function RecommendationsTab({ study, onAdd, onCreateAction }: { study: any; onAdd: (values: Record<string, any>) => void; onCreateAction: (id: string) => void }) {
  return <div className="space-y-4"><AddRecommendationForm scenarios={study.scenarios ?? []} onSubmit={onAdd} /><div className="grid gap-3">{(study.recommendations ?? []).map((rec: any) => <div key={rec.id} className="rounded-xl border border-[var(--psm-line)] p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="font-semibold">{rec.recommendation_number} · {rec.title}</div><p className="mt-2 text-sm text-[var(--psm-muted)]">{rec.description}</p></div><div className="flex gap-2"><RiskBadge value={rec.priority === 'Safety Critical' ? 'Critical' : rec.priority} /><button onClick={() => onCreateAction(rec.id)} className="rounded-lg border border-[var(--psm-line)] px-3 py-2 text-xs font-semibold">Create Action</button></div></div></div>)}</div></div>;
}

function LinkedTab({ study }: { study: any }) {
  return <div className="grid gap-3">{(study.linkedRecords ?? []).map((link: any) => <div key={link.id} className="rounded-xl border border-[var(--psm-line)] p-4"><div className="font-semibold">{link.record_type} · {link.record_number ?? link.record_id}</div><p className="text-sm text-[var(--psm-muted)]">{link.title ?? link.link_reason ?? 'Linked record'}</p></div>)}{!(study.linkedRecords ?? []).length ? <Empty text="No linked records yet." /> : null}</div>;
}

function SignoffTab({ study }: { study: any }) {
  return <div className="grid gap-3 lg:grid-cols-2">{(study.signoffs ?? []).map((signoff: any) => <div key={signoff.id} className="rounded-xl border border-[var(--psm-line)] p-4"><div className="flex items-center justify-between"><div className="font-semibold">{signoff.role}</div><HazopStatusBadge value={signoff.status} /></div><p className="mt-2 text-sm text-[var(--psm-muted)]">{signoff.signed_at ? `Signed ${new Date(signoff.signed_at).toLocaleString()}` : 'Pending electronic signature requirement'}</p></div>)}{!(study.signoffs ?? []).length ? <Empty text="No sign-off requirements generated yet. Universal signature requirements can be configured for HAZOP approval." /> : null}</div>;
}

function HistoryTab({ events }: { events: any[] }) {
  return <div className="space-y-3">{events.map((event) => <div key={event.id} className="rounded-xl border border-[var(--psm-line)] p-4"><div className="font-semibold">{event.title}</div><p className="mt-1 text-sm text-[var(--psm-muted)]">{event.description}</p><div className="mt-2 text-xs text-[var(--psm-muted)]">{new Date(event.created_at).toLocaleString()}</div></div>)}</div>;
}

function AttachmentsTab({ attachments }: { attachments: any[] }) {
  return <div className="grid gap-3">{attachments.map((attachment) => <div key={attachment.id} className="rounded-xl border border-[var(--psm-line)] p-4"><div className="font-semibold">{attachment.file_name}</div><p className="text-sm text-[var(--psm-muted)]">{attachment.category} · {attachment.file_type ?? 'file'} · {attachment.file_size ?? 0} bytes</p></div>)}{!attachments.length ? <Empty text="No attachments uploaded." /> : null}</div>;
}



function AddScenarioForm({ nodes, onSubmit }: { nodes: any[]; onSubmit: (values: Record<string, any>) => void }) {
  const [form, setForm] = useState<Record<string, any>>({ severity: 3, likelihood: 3 });
  const set = (key: string, value: any) => setForm((current) => ({ ...current, [key]: value }));
  return <div className="rounded-xl border border-[var(--psm-line)] p-4"><div className="mb-3 font-semibold">Add Scenario</div><div className="grid gap-3 lg:grid-cols-4"><select className="input" value={form.nodeId ?? ''} onChange={(e) => set('nodeId', e.target.value)}><option value="">Node</option>{nodes.map((node) => <option key={node.id} value={node.id}>{node.node_number} {node.title}</option>)}</select><input className="input" placeholder="Guideword" onChange={(e) => set('guideword', e.target.value)} /><input className="input" placeholder="Parameter" onChange={(e) => set('parameter', e.target.value)} /><input className="input" placeholder="Deviation" onChange={(e) => set('deviation', e.target.value)} /><input className="input lg:col-span-2" placeholder="Cause" onChange={(e) => set('cause', e.target.value)} /><input className="input lg:col-span-2" placeholder="Consequence" onChange={(e) => set('consequence', e.target.value)} /><input className="input lg:col-span-2" placeholder="Existing safeguards" onChange={(e) => set('existingSafeguards', e.target.value)} /><input type="number" min={1} max={5} className="input" value={form.severity} onChange={(e) => set('severity', Number(e.target.value))} /><input type="number" min={1} max={5} className="input" value={form.likelihood} onChange={(e) => set('likelihood', Number(e.target.value))} /></div><button onClick={() => onSubmit(form)} className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">Save Scenario</button></div>;
}

function AddRecommendationForm({ scenarios, onSubmit }: { scenarios: any[]; onSubmit: (values: Record<string, any>) => void }) {
  const [form, setForm] = useState<Record<string, any>>({ priority: 'Medium' });
  const set = (key: string, value: any) => setForm((current) => ({ ...current, [key]: value }));
  return <div className="rounded-xl border border-[var(--psm-line)] p-4"><div className="mb-3 font-semibold">Add Recommendation</div><div className="grid gap-3 lg:grid-cols-4"><select className="input" onChange={(e) => set('scenarioId', e.target.value)}><option value="">Scenario</option>{scenarios.map((s) => <option key={s.id} value={s.id}>{s.scenario_number}</option>)}</select><select className="input" value={form.priority} onChange={(e) => set('priority', e.target.value)}><option>Low</option><option>Medium</option><option>High</option><option>Safety Critical</option></select><input type="date" className="input" onChange={(e) => set('dueDate', e.target.value)} /><input className="input" placeholder="Owner user ID" onChange={(e) => set('ownerId', e.target.value)} /><input className="input lg:col-span-2" placeholder="Title" onChange={(e) => set('title', e.target.value)} /><input className="input lg:col-span-2" placeholder="Description" onChange={(e) => set('description', e.target.value)} /></div><button onClick={() => onSubmit(form)} className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">Save Recommendation</button></div>;
}

function SummaryCard({ title, icon: Icon, value, lines, tone = 'text-[var(--psm-text)]' }: { title: string; icon: any; value: string; lines: string[]; tone?: string }) {
  return <section className="rounded-xl border border-[var(--psm-line)] p-4"><div className="flex items-center justify-between text-sm text-[var(--psm-muted)]"><span>{title}</span><Icon size={16} /></div><div className={`mt-3 text-3xl font-semibold ${tone}`}>{value}</div>{lines.map((line) => <div key={line} className="mt-1 text-xs text-[var(--psm-muted)]">{line}</div>)}</section>;
}

function Info({ title, lines }: { title: string; lines: any[] }) {
  return <section className="rounded-xl border border-[var(--psm-line)] p-4"><h3 className="mb-3 font-semibold">{title}</h3>{lines.filter(Boolean).length ? lines.filter(Boolean).map((line, i) => <p key={i} className="mb-2 text-sm text-[var(--psm-muted)]">{line}</p>) : <Empty text="No data captured yet." />}</section>;
}

function Metric({ label, value }: { label: string; value: any }) {
  return <div className="rounded-lg border border-[var(--psm-line)] p-3"><div className="text-xs text-[var(--psm-muted)]">{label}</div><div className="text-xl font-semibold">{value}</div></div>;
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-lg border border-dashed border-[var(--psm-line)] p-5 text-center text-sm text-[var(--psm-muted)]">{text}</div>;
}

function ActionButton({ children, onClick, danger }: { children: ReactNode; onClick: () => void; danger?: boolean }) {
  return <button onClick={onClick} className={`rounded-lg border px-3 py-2 text-sm font-semibold ${danger ? 'border-red-500/30 text-red-300 hover:bg-red-500/10' : 'border-[var(--psm-line)] hover:bg-[var(--psm-surface-2)]'}`}>{children}</button>;
}

function ScenarioDrawer({ scenario, onClose }: { scenario: any; onClose: () => void }) {
  return <div className="fixed inset-0 z-50 bg-black/50"><aside className="ml-auto h-full w-full max-w-xl overflow-y-auto border-l border-[var(--psm-line)] bg-[var(--psm-surface)] p-6 shadow-2xl"><div className="mb-4 flex items-start justify-between"><div><h2 className="text-xl font-semibold">{scenario.scenario_number}</h2><RiskBadge value={scenario.risk_level} /></div><button onClick={onClose} className="rounded-lg border border-[var(--psm-line)] px-3 py-2 text-sm">Close</button></div><Info title="Cause" lines={[scenario.cause]} /><div className="h-3" /><Info title="Consequence" lines={[scenario.consequence]} /><div className="h-3" /><Info title="Safeguards" lines={[scenario.existing_safeguards]} /><div className="mt-4 grid grid-cols-3 gap-3"><Metric label="Severity" value={scenario.severity} /><Metric label="Likelihood" value={scenario.likelihood} /><Metric label="Score" value={scenario.risk_score} /></div></aside></div>;
}
