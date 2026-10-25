'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldAlert,
  ShieldCheck,
  Cpu,
  FileCheck2,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  ExternalLink,
  PlusCircle
} from 'lucide-react';
import { psiCompletenessService } from '../services/psi-completeness.service';

interface LiveEquipmentBaselineTableProps {
  unitId: string;
  unitCode?: string;
  unitName?: string;
}

export function LiveEquipmentBaselineTable({
  unitId,
  unitCode,
  unitName
}: LiveEquipmentBaselineTableProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'sce' | 'gaps'>('all');

  const liveQuery = useQuery({
    queryKey: ['psi', 'live-equipment-completeness', unitId],
    queryFn: () => psiCompletenessService.liveEquipment(unitId),
    enabled: Boolean(unitId)
  });

  const syncMutation = useMutation({
    mutationFn: () => psiCompletenessService.syncLiveEquipmentTags(unitId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['psi', 'live-equipment-completeness', unitId] });
      queryClient.invalidateQueries({ queryKey: ['psi', 'completeness', unitId] });
      queryClient.invalidateQueries({ queryKey: ['psi', 'equipment-design'] });
    }
  });

  const data = liveQuery.data as any;
  const summary = data?.summary;
  const tags: any[] = data?.tags ?? [];

  const filteredTags = useMemo(() => {
    return tags.filter((item) => {
      const matchesSearch =
        search.trim() === '' ||
        String(item.tag ?? '').toLowerCase().includes(search.toLowerCase()) ||
        String(item.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
        String(item.type ?? '').toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) return false;
      if (filterMode === 'sce') return Boolean(item.safetyCritical);
      if (filterMode === 'gaps') return !item.isComplete;
      return true;
    });
  }, [tags, search, filterMode]);

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* Header & Live KPI Cards */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Live Equipment Baseline Readiness
            </h3>
            <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300">
              OSHA 1910.119(d)(3)
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
            Real-time synchronization of registered physical assets against PSI Design Basis, P&ID Drawings, and Relief Sizing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending || liveQuery.isLoading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 shadow-sm transition-colors hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 dark:border-indigo-900/60 dark:bg-indigo-950/50 dark:text-indigo-300 dark:hover:bg-indigo-900/50"
            title="Auto-create missing PSI design basis entries for unlinked equipment tags"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
            {syncMutation.isPending ? 'Syncing Tags...' : 'Sync Missing Tags'}
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-800/40">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Registered Assets</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {summary?.totalLiveEquipment ?? 0}
            </span>
            <span className="text-xs text-slate-600 dark:text-slate-400">Total in Unit</span>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-800/40">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Safety-Critical (SCE)</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-bold text-amber-600 dark:text-amber-400">
              {summary?.safetyCriticalTotal ?? 0}
            </span>
            <span className="text-xs text-slate-600 dark:text-slate-400">PSM Critical</span>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-800/40">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">SCE Baseline Readiness</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className={`text-xl font-bold ${
              (summary?.sceReadinessScore ?? 100) >= 90
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}>
              {summary?.sceReadinessScore ?? 0}%
            </span>
            <span className="text-xs text-slate-600 dark:text-slate-400">
              {summary?.sceComplete ?? 0}/{summary?.safetyCriticalTotal ?? 0} Complete
            </span>
          </div>
        </div>

        <div className={`rounded-lg border p-3 ${
          (summary?.pssrBlockers ?? 0) === 0
            ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-950/60 dark:bg-emerald-950/20'
            : 'border-rose-200 bg-rose-50/50 dark:border-rose-950/60 dark:bg-rose-950/20'
        }`}>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Startup Blockers</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className={`text-xl font-bold ${
              (summary?.pssrBlockers ?? 0) === 0
                ? 'text-emerald-700 dark:text-emerald-400'
                : 'text-rose-700 dark:text-rose-400'
            }`}>
              {summary?.pssrBlockers ?? 0}
            </span>
            <span className="text-xs font-semibold">
              {(summary?.pssrBlockers ?? 0) === 0 ? (
                <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                  <ShieldCheck className="h-3.5 w-3.5" /> Clear
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-rose-700 dark:text-rose-400">
                  <ShieldAlert className="h-3.5 w-3.5" /> Blocked
                </span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search equipment tag, name, or type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50/60 pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:placeholder-slate-500"
          />
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <span className="text-xs text-slate-500 dark:text-slate-400">Filter:</span>
          <button
            onClick={() => setFilterMode('all')}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              filterMode === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            All ({tags.length})
          </button>
          <button
            onClick={() => setFilterMode('sce')}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              filterMode === 'sce'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            SCE Only ({tags.filter((t) => t.safetyCritical).length})
          </button>
          <button
            onClick={() => setFilterMode('gaps')}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              filterMode === 'gaps'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            Gaps Only ({tags.filter((t) => !t.isComplete).length})
          </button>
        </div>
      </div>

      {/* Equipment Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
        <table className="min-w-full text-xs">
          <thead className="border-b border-slate-200 bg-slate-50 text-left font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
            <tr>
              <th className="py-2.5 px-3">Equipment Tag & Name</th>
              <th className="py-2.5 px-3">Type / Category</th>
              <th className="py-2.5 px-3 text-center">Design Basis</th>
              <th className="py-2.5 px-3 text-center">P&ID Drawing</th>
              <th className="py-2.5 px-3 text-center">Relief Sizing</th>
              <th className="py-2.5 px-3 text-center">Readiness</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {liveQuery.isLoading ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500">
                  <RefreshCw className="mx-auto h-5 w-5 animate-spin text-indigo-500 mb-2" />
                  Evaluating live equipment tags against PSI technical baseline...
                </td>
              </tr>
            ) : filteredTags.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-6 text-center text-slate-500 dark:text-slate-400">
                  No matching equipment found for this unit.
                </td>
              </tr>
            ) : (
              filteredTags.map((eq) => (
                <tr
                  key={eq.tag}
                  className={`transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                    eq.pssrBlocker ? 'bg-rose-50/30 dark:bg-rose-950/10' : ''
                  }`}
                >
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                        {eq.tag}
                      </span>
                      {eq.safetyCritical && (
                        <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                          SCE
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {eq.name}
                    </div>
                  </td>

                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                    <div>{eq.type}</div>
                    <div className="text-[10px] text-slate-400">{eq.source}</div>
                  </td>

                  <td className="py-2.5 px-3 text-center">
                    {eq.hasDesignBasis ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span className="text-[11px] font-medium">Linked</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400">
                        <XCircle className="h-3.5 w-3.5" />
                        <span className="text-[11px] font-medium">Missing</span>
                      </span>
                    )}
                  </td>

                  <td className="py-2.5 px-3 text-center">
                    {eq.hasDrawing ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span className="text-[11px] font-medium">{eq.drawingCount} Linked</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400">
                        <XCircle className="h-3.5 w-3.5" />
                        <span className="text-[11px] font-medium">Missing</span>
                      </span>
                    )}
                  </td>

                  <td className="py-2.5 px-3 text-center">
                    {!eq.isPressureContaining ? (
                      <span className="text-[11px] text-slate-400">N/A</span>
                    ) : eq.hasRelief ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span className="text-[11px] font-medium">Verified</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400">
                        <XCircle className="h-3.5 w-3.5" />
                        <span className="text-[11px] font-medium">Required</span>
                      </span>
                    )}
                  </td>

                  <td className="py-2.5 px-3 text-center">
                    {eq.isComplete ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        Complete
                      </span>
                    ) : eq.pssrBlocker ? (
                      <span className="inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                        PSSR Blocker
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        Incomplete
                      </span>
                    )}
                  </td>

                  <td className="py-2.5 px-3 text-right">
                    {eq.designBasisId ? (
                      <Link
                        href={`/process-safety-information/equipment-design/${eq.designBasisId}`}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                      >
                        <span>View</span>
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    ) : (
                      <Link
                        href={`/process-safety-information/equipment-design/new?unitId=${unitId}&equipmentTag=${encodeURIComponent(eq.tag)}&equipmentName=${encodeURIComponent(eq.name)}&equipmentType=${encodeURIComponent(eq.type)}`}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                      >
                        <PlusCircle className="h-3 w-3" />
                        <span>Add Basis</span>
                      </Link>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
