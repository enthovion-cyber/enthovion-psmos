'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Compass,
  Database,
  ExternalLink,
  Flame,
  GitBranch,
  Layers,
  Network,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Zap
} from 'lucide-react';
import { api } from '@/services/api';
import { useCopilotStore } from '@/features/ai/stores/useCopilotStore';
import { useMutationToast } from '@/providers/ToastProvider';

const unwrap = <T,>(response: { data: { data: T } | T }) => {
  const d = response.data;
  if (d && typeof d === 'object' && 'data' in d) {
    return (d as { data: T }).data;
  }
  return d as T;
};

export function CentralizedBarrierHealthPage() {
  const { openDrawer } = useCopilotStore();
  const toast = useMutationToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'barriers' | 'graph'>('barriers');
  const [traceType, setTraceType] = useState('Equipment');
  const [traceId, setTraceId] = useState('P-101A');
  const [selectedBarrier, setSelectedBarrier] = useState<any>(null);

  // Queries
  const barrierQuery = useQuery({
    queryKey: ['ai', 'barriers', 'health-summary'],
    queryFn: () => api.get('/ai/barriers/health-summary').then(unwrap<any>)
  });

  const graphQuery = useQuery({
    queryKey: ['ai', 'graph', 'trace', traceType, traceId],
    queryFn: () => api.get(`/ai/graph/trace?type=${traceType}&id=${traceId}&depth=3`).then(unwrap<any>),
    enabled: activeTab === 'graph' && Boolean(traceId)
  });

  const verifyMutation = useMutation({
    mutationFn: ({ relId, approve }: { relId: string; approve: boolean }) =>
      api.patch(`/ai/graph/relationship/${relId}/verify`, { approve }).then(unwrap<any>),
    onSuccess: () => {
      toast.success('Relationship Status Updated', 'Relationship verified and promoted in knowledge graph.');
      queryClient.invalidateQueries({ queryKey: ['ai', 'graph'] });
    }
  });

  const data = barrierQuery.data;

  return (
    <main className="space-y-6">
      {/* Header Banner */}
      <section className="psm-card p-6 border-l-4 border-l-emerald-600 dark:border-l-emerald-500">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-tight">Barrier Health & Process Safety Knowledge Graph</h1>
                <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Phase 4 Intelligence
                </span>
              </div>
              <p className="mt-1 text-sm text-[var(--psm-muted)] max-w-3xl">
                Continuous real-time barrier health monitoring across safety-critical equipment, emergency isolation systems, and relational engineering lineage.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => openDrawer('mechanical-integrity')}
              className="psm-button border border-blue-500/40 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center gap-1.5 px-4 py-2 text-xs font-semibold"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Ask Copilot
            </button>
            <button
              onClick={() => barrierQuery.refetch()}
              className="psm-button psm-button-primary flex items-center gap-2 px-4 py-2 text-xs font-semibold"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh Signals
            </button>
          </div>
        </div>
      </section>

      {/* KPI Metric Summary Strip */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="psm-card p-4 flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-[var(--psm-muted)] font-medium uppercase tracking-wider">Total Barriers</div>
            <div className="text-xl font-bold mt-0.5">{data?.totalBarriers || 0}</div>
          </div>
        </div>

        <div className="psm-card p-4 flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-[var(--psm-muted)] font-medium uppercase tracking-wider">Fully Healthy</div>
            <div className="text-xl font-bold mt-0.5 text-emerald-600 dark:text-emerald-400">
              {data?.healthyCount || 0}
            </div>
          </div>
        </div>

        <div className="psm-card p-4 flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-[var(--psm-muted)] font-medium uppercase tracking-wider">Active Impairments</div>
            <div className="text-xl font-bold mt-0.5 text-rose-600 dark:text-rose-400">
              {data?.impairedCount || 0}
            </div>
          </div>
        </div>

        <div className="psm-card p-4 flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-[var(--psm-muted)] font-medium uppercase tracking-wider">Overdue Inspection</div>
            <div className="text-xl font-bold mt-0.5 text-amber-600 dark:text-amber-400">
              {data?.overdueInspectionCount || 0}
            </div>
          </div>
        </div>

        <div className="psm-card p-4 flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-[var(--psm-muted)] font-medium uppercase tracking-wider">Feed Unavailable</div>
            <div className="text-xl font-bold mt-0.5 text-slate-700 dark:text-slate-300">
              {data?.unavailableCount || 0}
            </div>
          </div>
        </div>
      </section>

      {/* Mode Navigation Tabs */}
      <div className="flex border-b border-[var(--psm-line)] gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('barriers')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition ${
            activeTab === 'barriers'
              ? 'border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400'
              : 'border-transparent text-[var(--psm-muted)] hover:text-[var(--psm-fg)]'
          }`}
        >
          <Activity className="w-4 h-4" />
          Barrier Health Register ({data?.barriers?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('graph')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition ${
            activeTab === 'graph'
              ? 'border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400'
              : 'border-transparent text-[var(--psm-muted)] hover:text-[var(--psm-fg)]'
          }`}
        >
          <Network className="w-4 h-4" />
          Engineering Knowledge Graph & Lineage
        </button>
      </div>

      {/* Tab 1: Barrier Health Register */}
      {activeTab === 'barriers' && (
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="psm-card overflow-hidden">
              <div className="p-4 border-b border-[var(--psm-line)] bg-[var(--psm-surface-2)] flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--psm-muted)]">
                  Safety Critical Element Status
                </span>
                <span className="text-xs text-[var(--psm-muted)]">Verified against live maintenance & inspection logs</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[var(--psm-line)] text-[var(--psm-muted)] uppercase bg-[var(--psm-surface)]">
                      <th className="py-3 px-4">Barrier / Asset Tag</th>
                      <th className="py-3 px-4">Barrier Type</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Location</th>
                      <th className="py-3 px-4">Actions Overdue</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--psm-line)]">
                    {data?.barriers?.map((b: any) => (
                      <tr
                        key={b.barrierId}
                        onClick={() => setSelectedBarrier(b)}
                        className={`cursor-pointer transition hover:bg-[var(--psm-surface-2)] ${
                          selectedBarrier?.barrierId === b.barrierId ? 'bg-blue-500/10' : ''
                        }`}
                      >
                        <td className="py-3 px-4 font-semibold text-[var(--psm-fg)]">
                          {b.barrierName}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-[var(--psm-muted)]">
                          {b.barrierType.replace('_', ' ')}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                              b.status === 'HEALTHY'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300'
                                : b.status === 'IMPAIRED'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300'
                                : b.status === 'DATA_UNAVAILABLE'
                                ? 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-400'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300'
                            }`}
                          >
                            {b.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[var(--psm-muted)]">{b.location}</td>
                        <td className="py-3 px-4 font-mono font-medium">
                          {b.overdueActions > 0 ? (
                            <span className="text-amber-600 dark:text-amber-400 font-bold">{b.overdueActions} overdue</span>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400">0</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setTraceType('Equipment');
                              setTraceId(b.barrierId);
                              setActiveTab('graph');
                            }}
                            className="text-blue-600 dark:text-blue-400 hover:underline font-semibold text-xs flex items-center gap-1 justify-end"
                          >
                            Trace <ArrowRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Barrier Detail & Scenario Links */}
          <div className="space-y-4">
            {selectedBarrier ? (
              <div className="psm-card p-5 space-y-4 border-l-2 border-l-blue-500">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Barrier Deep Dive</h3>
                  <span className="text-xs font-mono text-[var(--psm-muted)]">{selectedBarrier.barrierId}</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-[var(--psm-muted)]">Target Asset:</span>
                    <div className="font-semibold text-sm mt-0.5">{selectedBarrier.barrierName}</div>
                  </div>
                  <div>
                    <span className="text-[var(--psm-muted)]">Last Proof Test / Inspection:</span>
                    <div className="font-mono mt-0.5">{new Date(selectedBarrier.lastTestedAt).toLocaleDateString()}</div>
                  </div>
                </div>

                {/* Linked Scenarios */}
                <div className="pt-2 border-t border-[var(--psm-line)] space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--psm-muted)] flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-rose-500" />
                    Guarded Hazard Scenarios ({selectedBarrier.relatedScenarios?.length || 0})
                  </span>
                  <div className="space-y-2">
                    {selectedBarrier.relatedScenarios?.map((s: any, idx: number) => (
                      <div key={idx} className="p-2.5 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-xs">
                        <div className="flex justify-between font-semibold">
                          <span>{s.scenarioId}</span>
                          <span className="text-rose-600 dark:text-rose-400 font-mono text-[10px]">{s.consequenceSeverity} SEVERITY</span>
                        </div>
                        <p className="text-[var(--psm-muted)] mt-1">{s.hazard}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => openDrawer('mechanical-integrity')}
                  className="psm-button border border-[var(--psm-line)] w-full py-2 text-xs font-semibold flex items-center justify-center gap-2 hover:bg-[var(--psm-surface-2)]"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                  Analyze Barrier with Copilot
                </button>
              </div>
            ) : (
              <div className="psm-card p-6 text-center text-xs text-[var(--psm-muted)] space-y-2">
                <Compass className="w-8 h-8 mx-auto text-[var(--psm-muted)] opacity-60" />
                <p>Select any safety barrier from the register to inspect its guarded hazard scenarios and proof test history.</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Tab 2: Knowledge Graph Lineage Explorer */}
      {activeTab === 'graph' && (
        <section className="space-y-4">
          <div className="psm-card p-4 flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold text-[var(--psm-muted)] uppercase tracking-wider">Entity Lineage Query:</span>
            <select
              value={traceType}
              onChange={(e) => setTraceType(e.target.value)}
              className="psm-input px-3 py-1.5 text-xs font-medium"
            >
              <option value="Equipment">Equipment</option>
              <option value="HAZOP_Scenario">HAZOP Scenario</option>
              <option value="LOPA_IPL">LOPA Safeguard</option>
              <option value="Procedure">Procedure</option>
              <option value="Moc">MOC Change</option>
            </select>
            <input
              type="text"
              placeholder="Entity Tag or ID (e.g. P-101A, HAZOP-NODE-1.2)"
              value={traceId}
              onChange={(e) => setTraceId(e.target.value)}
              className="psm-input flex-1 min-w-[220px] px-3 py-1.5 text-xs font-mono"
            />
            <button
              onClick={() => graphQuery.refetch()}
              className="psm-button psm-button-primary text-xs font-semibold px-4 py-1.5 flex items-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5" />
              Traverse Lineage
            </button>
          </div>

          <div className="psm-card p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--psm-line)]">
              <div>
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-blue-500" />
                  Engineering Lineage Graph Trace: {traceType} [{traceId}]
                </h3>
                <p className="text-xs text-[var(--psm-muted)] mt-0.5">
                  Trace depth: 3 hops. Verified connections vs. proposed AI links.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-semibold">
                  {graphQuery.data?.verifiedCount || 0} Verified
                </span>
                <span className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-semibold">
                  {graphQuery.data?.proposedCount || 0} Proposed
                </span>
              </div>
            </div>

            {graphQuery.isLoading ? (
              <div className="py-10 text-center text-xs text-[var(--psm-muted)] flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
                <span>Traversing recursive relationship graph...</span>
              </div>
            ) : graphQuery.data?.nodes?.length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {graphQuery.data.nodes.map((node: any, i: number) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-[var(--psm-muted)] uppercase">
                        {node.direction} · {node.relation}
                      </span>
                      <span
                        className={`px-2 py-0.2 rounded text-[10px] font-bold uppercase border ${
                          node.status === 'VERIFIED'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300'
                        }`}
                      >
                        {node.status}
                      </span>
                    </div>

                    <div className="font-semibold text-sm text-[var(--psm-fg)]">
                      [{node.type}] {node.id}
                    </div>

                    {node.confidence && (
                      <div className="text-[11px] text-[var(--psm-muted)]">
                        Confidence: {(node.confidence * 100).toFixed(0)}%
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-[var(--psm-muted)] space-y-2">
                <Network className="w-8 h-8 mx-auto opacity-50" />
                <p>No relational graph edges recorded for {traceType} [{traceId}].</p>
                <p className="text-[11px]">Relationships between P&IDs, HAZOP safeguards, and inspection records will appear here as they are verified.</p>
              </div>
            )}
          </div>
        </section>
      )}
    </main>
  );
}
