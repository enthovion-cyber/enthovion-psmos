'use client';

import { useMemo, useState } from 'react';
import { 
  AlertTriangle, 
  ArrowUpRight, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  FileCheck2, 
  Flame, 
  GitMerge, 
  Layers, 
  Plus, 
  Search, 
  ShieldAlert, 
  SlidersHorizontal 
} from 'lucide-react';
import Link from 'next/link';
import type { EquipmentLinkedRecord } from '@/services/equipment.service';

type ModuleFilter = 'ALL' | 'PTW' | 'MOC' | 'PSSR' | 'HAZOP' | 'LOPA' | 'INCIDENTS' | 'ACTIONS';

export function LinkedRecordsPanel({ 
  records, 
  filter: initialFilter 
}: { 
  records: EquipmentLinkedRecord[]; 
  filter?: string | undefined 
}) {
  const [selectedModule, setSelectedModule] = useState<ModuleFilter>(
    (initialFilter?.toUpperCase() as ModuleFilter) || 'ALL'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Breakdown statistics
  const stats = useMemo(() => {
    const ptw = records.filter((r) => r.moduleKey.toLowerCase() === 'ptw');
    const moc = records.filter((r) => r.moduleKey.toLowerCase() === 'moc');
    const pssr = records.filter((r) => r.moduleKey.toLowerCase() === 'pssr');
    const hazop = records.filter((r) => ['hazop', 'pha', 'lopa'].includes(r.moduleKey.toLowerCase()));
    const incidents = records.filter((r) => ['incidents', 'actions'].includes(r.moduleKey.toLowerCase()));

    const activePtw = ptw.filter((r) => !['CLOSED', 'CANCELLED', 'EXPIRED'].includes(r.status.toUpperCase()));

    return {
      total: records.length,
      ptwCount: ptw.length,
      activePtwCount: activePtw.length,
      mocCount: moc.length,
      pssrCount: pssr.length,
      hazopCount: hazop.length,
      incidentsCount: incidents.length,
      hasSimOpsConflict: activePtw.length >= 2
    };
  }, [records]);

  // Filtered records
  const filtered = useMemo(() => {
    return records.filter((record) => {
      const mod = record.moduleKey.toUpperCase();
      const matchesModule = 
        selectedModule === 'ALL' ||
        mod === selectedModule ||
        (selectedModule === 'HAZOP' && (mod === 'PHA' || mod === 'LOPA'));

      const matchesSearch = 
        record.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.recordType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.recordId.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = 
        statusFilter === 'ALL' || record.status.toUpperCase() === statusFilter;

      return matchesModule && matchesSearch && matchesStatus;
    });
  }, [records, selectedModule, searchQuery, statusFilter]);

  const modulePills: Array<{ key: ModuleFilter; label: string; count: number }> = [
    { key: 'ALL', label: 'All Records', count: records.length },
    { key: 'PTW', label: 'Permit to Work (PTW)', count: stats.ptwCount },
    { key: 'MOC', label: 'Management of Change (MOC)', count: stats.mocCount },
    { key: 'PSSR', label: 'Pre-Startup (PSSR)', count: stats.pssrCount },
    { key: 'HAZOP', label: 'PHA / HAZOP & LOPA', count: stats.hazopCount },
    { key: 'INCIDENTS', label: 'Incidents & Actions', count: stats.incidentsCount }
  ];

  return (
    <div className="space-y-5 psm-fade-in">
      {/* 1. SimOps Alert Banner if simultaneous active permits */}
      {stats.hasSimOpsConflict && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-amber-300">
          <AlertTriangle size={20} className="shrink-0 mt-0.5 text-amber-400" />
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold text-amber-200">
              Simultaneous Operations (SimOps) Active Notice
            </h4>
            <p className="mt-0.5 text-xs text-amber-300/90 leading-relaxed">
              There are currently <strong>{stats.activePtwCount} active work permits</strong> assigned to or in proximity of this equipment. 
              Verify physical isolations, energy lockout (LOTO), and hot-work combustible gas limits before authorizing additional work.
            </p>
          </div>
        </div>
      )}

      {/* 2. KPI Summary Metrics Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <MetricCard label="Total Linked Records" value={stats.total} icon={<Layers size={16} />} tone="primary" />
        <MetricCard label="Permits to Work" value={stats.ptwCount} activePill={stats.activePtwCount > 0 ? `${stats.activePtwCount} active` : undefined} icon={<Flame size={16} />} tone="amber" />
        <MetricCard label="Changes (MOC)" value={stats.mocCount} icon={<GitMerge size={16} />} tone="purple" />
        <MetricCard label="Pre-Startup (PSSR)" value={stats.pssrCount} icon={<FileCheck2 size={16} />} tone="teal" />
        <MetricCard label="Hazards / Incidents" value={stats.hazopCount + stats.incidentsCount} icon={<ShieldAlert size={16} />} tone="rose" />
      </div>

      {/* 3. Toolbar: Search, Module Pills, and Quick Create Dropdown */}
      <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--psm-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search linked records by title, code, or type..."
              className="psm-input w-full pl-9 text-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="psm-input text-xs py-1.5"
            >
              <option value="ALL">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Active</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="APPROVED">Approved</option>
              <option value="CLOSED">Closed / Completed</option>
            </select>

            <Link
              href="/ptw/new"
              className="psm-button psm-button-primary text-xs font-semibold shadow-sm"
            >
              <Plus size={14} /> New PTW
            </Link>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-1.5 border-t border-[var(--psm-line)] pt-3">
          {modulePills.map((pill) => (
            <button
              key={pill.key}
              type="button"
              onClick={() => setSelectedModule(pill.key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                selectedModule === pill.key
                  ? 'bg-primary text-white shadow-sm'
                  : 'border border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-[var(--psm-muted)] hover:bg-[var(--psm-surface-3)] hover:text-[var(--psm-text)]'
              }`}
            >
              {pill.label} <span className="ml-1 opacity-80">({pill.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* 4. Linked Records Grid Cards */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--psm-line)] bg-[var(--psm-surface)] p-12 text-center text-sm text-[var(--psm-muted)]">
          No records match your selected filter.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((record) => {
            const url = resolveRecordUrl(record);
            return (
              <div
                key={record.id}
                className="group flex flex-col justify-between rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 shadow-sm hover:border-primary/50 hover:shadow-md transition"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold ${getModuleBadgeClass(record.moduleKey)}`}>
                      {getModuleIcon(record.moduleKey)}
                      {record.moduleKey.toUpperCase()}
                    </span>

                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${getStatusClass(record.status)}`}>
                      {record.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <h3 className="mt-3 text-sm font-semibold text-[var(--psm-text)] line-clamp-2 group-hover:text-primary transition">
                    {record.title}
                  </h3>

                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[var(--psm-muted)]">
                    <span className="font-mono">{record.recordType}</span>
                    <span>•</span>
                    <span>ID: {record.recordId || record.id.slice(0, 8)}</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-[var(--psm-line)] pt-3 text-xs">
                  <span className="text-[var(--psm-muted)]">
                    {record.priority ? (
                      <span className="font-semibold text-warning">
                        Priority: {record.priority.replace(/_/g, ' ')}
                      </span>
                    ) : (
                      'Standard Record'
                    )}
                  </span>

                  <Link
                    href={url}
                    className="inline-flex items-center gap-1 font-semibold text-info hover:text-info/80 hover:underline"
                  >
                    View Record <ArrowUpRight size={13} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  activePill,
  icon,
  tone
}: {
  label: string;
  value: number;
  activePill?: string;
  icon: React.ReactNode;
  tone: 'primary' | 'amber' | 'purple' | 'teal' | 'rose';
}) {
  const tones = {
    primary: 'bg-primary/10 text-primary border-primary/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    teal: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  };

  return (
    <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-3.5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-[var(--psm-muted)] uppercase tracking-wider">{label}</span>
        <div className={`grid h-6 w-6 place-items-center rounded-md border ${tones[tone]}`}>
          {icon}
        </div>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-[var(--psm-text)]">{value}</span>
        {activePill && (
          <span className="rounded-full bg-amber-500/20 px-1.5 py-0.2 text-[10px] font-bold text-amber-300">
            {activePill}
          </span>
        )}
      </div>
    </div>
  );
}

function getModuleIcon(moduleKey: string) {
  const m = moduleKey.toLowerCase();
  if (m === 'ptw') return <Flame size={12} />;
  if (m === 'moc') return <GitMerge size={12} />;
  if (m === 'pssr') return <FileCheck2 size={12} />;
  return <ShieldAlert size={12} />;
}

function getModuleBadgeClass(moduleKey: string) {
  const m = moduleKey.toLowerCase();
  if (m === 'ptw') return 'bg-amber-500/15 text-amber-400 border border-amber-500/30';
  if (m === 'moc') return 'bg-purple-500/15 text-purple-400 border border-purple-500/30';
  if (m === 'pssr') return 'bg-teal-500/15 text-teal-400 border border-teal-500/30';
  if (m === 'hazop' || m === 'pha' || m === 'lopa') return 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30';
  return 'bg-rose-500/15 text-rose-400 border border-rose-500/30';
}

function getStatusClass(status: string) {
  const s = status.toUpperCase();
  if (s === 'ACTIVE' || s === 'APPROVED' || s === 'ISSUED') return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
  if (s === 'DRAFT') return 'bg-[var(--psm-surface-3)] text-[var(--psm-muted)] border border-[var(--psm-line)]';
  if (s === 'PENDING' || s === 'IN_PROGRESS' || s === 'UNDER_REVIEW') return 'bg-amber-500/15 text-amber-400 border border-amber-500/30';
  if (s === 'CLOSED' || s === 'COMPLETED') return 'bg-slate-500/15 text-slate-400 border border-slate-500/30';
  return 'bg-red-500/15 text-red-400 border border-red-500/30';
}

function resolveRecordUrl(record: EquipmentLinkedRecord): string {
  if (record.url) return record.url;
  const m = record.moduleKey.toLowerCase();
  const id = record.recordId || record.id;
  if (m === 'ptw') return `/ptw/${id}`;
  if (m === 'moc') return `/moc/${id}`;
  if (m === 'pssr') return `/pssr/${id}`;
  if (m === 'hazop') return `/hazop/${id}`;
  if (m === 'lopa') return `/lopa/${id}`;
  if (m === 'incidents') return `/incidents/${id}`;
  return `/actions/${id}`;
}
