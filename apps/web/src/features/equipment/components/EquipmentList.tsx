'use client';

import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowDownAZ,
  ChevronLeft,
  ChevronRight,
  Columns3,
  Filter,
  Grid2X2,
  ListChecks,
  MoreHorizontal,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Table2
} from 'lucide-react';
import { useEquipmentList } from '../hooks/useEquipment';
import { equipmentService, type Equipment, type EquipmentCriticality, type EquipmentStatus } from '@/services/equipment.service';
import { ConfirmDialog } from './EnterpriseOverlay';
import { useMutationToast } from '@/providers/ToastProvider';

type SortKey = 'tag' | 'name' | 'status' | 'criticality' | 'commissionDate';
type ViewMode = 'table' | 'cards';

const pageSize = 8;

const columnDefaults = {
  tag: true,
  name: true,
  type: true,
  status: true,
  criticality: true,
  service: true,
  compliance: true,
  maintenance: true
};

const statusFilterValues: Array<EquipmentStatus | 'ALL'> = ['ALL', 'ACTIVE', 'INACTIVE', 'OUT_OF_SERVICE', 'DECOMMISSIONED'];
const criticalityFilterValues: Array<EquipmentCriticality | 'ALL'> = ['ALL', 'LOW', 'MEDIUM', 'HIGH', 'SAFETY_CRITICAL'];

export function EquipmentList() {
  const { data = [], isLoading, isError } = useEquipmentList();
  const queryClient = useQueryClient();
  const toast = useMutationToast();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<EquipmentStatus | 'ALL'>('ALL');
  const [criticality, setCriticality] = useState<EquipmentCriticality | 'ALL'>('ALL');
  const [sortKey, setSortKey] = useState<SortKey>('tag');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [view, setView] = useState<ViewMode>('table');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [columns, setColumns] = useState(columnDefaults);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<Equipment | null>(null);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return data
      .filter((item) => status === 'ALL' || item.status === status)
      .filter((item) => criticality === 'ALL' || item.criticality === criticality)
      .filter((item) => {
        if (!normalized) return true;
        return [item.tag, item.name, item.type, item.subtype, item.manufacturer, item.model, item.fluidService, item.systemName, item.unit?.name, item.area?.name]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalized));
      })
      .sort((a, b) => {
        const left = String(a[sortKey] ?? '');
        const right = String(b[sortKey] ?? '');
        const result = left.localeCompare(right, undefined, { numeric: true, sensitivity: 'base' });
        return sortDirection === 'asc' ? result : -result;
      });
  }, [criticality, data, query, sortDirection, sortKey, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);
  const activeCount = data.filter((item) => item.status === 'ACTIVE').length;
  const highRiskCount = data.filter((item) => item.criticality === 'HIGH' || item.criticality === 'SAFETY_CRITICAL').length;
  const dueCount = data.filter((item) => item.maintenancePriority === 'HIGH' || item.rbiPriority === 'HIGH').length;
  const avgCompliance = data.length ? Math.round(data.reduce((sum, item) => sum + complianceScore(item), 0) / data.length) : 0;
  const allPageSelected = pageItems.length > 0 && pageItems.every((item) => selected.has(item.id));

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(key);
    setSortDirection('asc');
  }

  function toggleSelected(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function togglePageSelected() {
    setSelected((current) => {
      const next = new Set(current);
      if (allPageSelected) pageItems.forEach((item) => next.delete(item.id));
      else pageItems.forEach((item) => next.add(item.id));
      return next;
    });
  }

  async function archiveEquipment(item: Equipment) {
    try {
      await equipmentService.update(item.id, { status: 'DECOMMISSIONED' });
      await queryClient.invalidateQueries({ queryKey: ['equipment'] });
      toast.success('Equipment archived', `${item.tag} was moved to Decommissioned.`);
    } catch (error) {
      toast.error('Archive failed', getErrorMessage(error));
    } finally {
      setArchiveTarget(null);
      setMenuOpen(null);
    }
  }

  if (isLoading) return <RegistrySkeleton />;

  if (isError) {
    return (
      <div className="psm-card p-8">
        <div className="text-lg font-semibold text-danger">Equipment registry unavailable</div>
        <p className="mt-2 max-w-2xl text-sm text-[var(--psm-muted)]">The frontend could not load equipment from the API. Confirm the API is running and the browser has a valid session.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--psm-line)] bg-[var(--psm-surface)] px-3 py-1 text-xs font-semibold text-[var(--psm-muted)]">
            <ShieldCheck size={14} /> Module 00 Foundation
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Equipment Registry</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--psm-muted)]">Asset hierarchy, QR identity, classifications, inspections, controlled documents, and linked PSM records.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="psm-button psm-button-secondary"><SlidersHorizontal size={16} /> Configure View</button>
          <a href="/equipment/new" className="psm-button psm-button-primary"><Plus size={16} /> New Equipment</a>
        </div>
      </header>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Metric title="Active Assets" value={activeCount} tone="success" caption={`${data.length} total registered`} />
        <Metric title="High Risk / Critical" value={highRiskCount} tone="danger" caption="Safety-critical focus list" />
        <Metric title="Maintenance Due" value={dueCount} tone="warning" caption="RBI or maintenance priority high" />
        <Metric title="Avg. Compliance" value={`${avgCompliance}%`} tone="info" caption="Based on core asset completeness" />
      </section>

      <section className="psm-card overflow-hidden">
        <div className="border-b border-[var(--psm-line)] p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 flex-1 flex-col gap-3 md:flex-row">
              <label className="relative min-w-0 flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--psm-muted)]" size={17} />
                <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} className="psm-input w-full pl-10 pr-3 text-sm" placeholder="Search tag, name, manufacturer, model, unit, service..." />
              </label>
              <select value={status} onChange={(event) => { setStatus(event.target.value as EquipmentStatus | 'ALL'); setPage(1); }} className="psm-input px-3 text-sm">
                {statusFilterValues.map((value) => <option key={value} value={value}>{value === 'ALL' ? 'All Statuses' : label(value)}</option>)}
              </select>
              <select value={criticality} onChange={(event) => { setCriticality(event.target.value as EquipmentCriticality | 'ALL'); setPage(1); }} className="psm-input px-3 text-sm">
                {criticalityFilterValues.map((value) => <option key={value} value={value}>{value === 'ALL' ? 'All Criticalities' : label(value)}</option>)}
              </select>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {selected.size ? <button type="button" className="psm-button psm-button-secondary"><ListChecks size={16} /> Bulk Actions ({selected.size})</button> : null}
              <button type="button" className={`psm-button ${view === 'table' ? 'psm-button-primary' : 'psm-button-secondary'}`} onClick={() => setView('table')} aria-label="Table view"><Table2 size={16} /></button>
              <button type="button" className={`psm-button ${view === 'cards' ? 'psm-button-primary' : 'psm-button-secondary'}`} onClick={() => setView('cards')} aria-label="Card view"><Grid2X2 size={16} /></button>
              <div className="relative">
                <button type="button" onClick={() => setColumnsOpen((current) => !current)} className="psm-button psm-button-secondary"><Columns3 size={16} /> Columns</button>
                {columnsOpen ? (
                  <div className="psm-card absolute right-0 top-12 z-20 w-56 p-3">
                    {Object.keys(columns).map((key) => (
                      <label key={key} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-[var(--psm-surface-3)]">
                        <input type="checkbox" checked={columns[key as keyof typeof columns]} onChange={(event) => setColumns((current) => ({ ...current, [key]: event.target.checked }))} />
                        {label(key)}
                      </label>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="grid min-h-72 place-items-center p-8 text-center">
            <div>
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[var(--psm-surface-3)] text-[var(--psm-muted)]"><Filter size={24} /></div>
              <div className="mt-4 text-lg font-semibold">No equipment matches this view</div>
              <p className="mt-2 max-w-md text-sm text-[var(--psm-muted)]">Adjust search, status, or criticality filters to broaden the registry results.</p>
            </div>
          </div>
        ) : view === 'table' ? (
          <div className="max-h-[660px] overflow-auto">
            <table className="psm-table w-full min-w-[980px] text-left text-sm">
              <thead className="border-b border-[var(--psm-line)] text-xs uppercase tracking-wide text-[var(--psm-muted)]">
                <tr>
                  <th className="w-12 px-4 py-3"><input type="checkbox" checked={allPageSelected} onChange={togglePageSelected} aria-label="Select page equipment" /></th>
                  {columns.tag ? <SortableTh label="Tag" active={sortKey === 'tag'} onClick={() => toggleSort('tag')} /> : null}
                  {columns.name ? <SortableTh label="Asset Name" active={sortKey === 'name'} onClick={() => toggleSort('name')} /> : null}
                  {columns.type ? <th className="px-4 py-3">Type</th> : null}
                  {columns.status ? <SortableTh label="Status" active={sortKey === 'status'} onClick={() => toggleSort('status')} /> : null}
                  {columns.criticality ? <SortableTh label="Risk" active={sortKey === 'criticality'} onClick={() => toggleSort('criticality')} /> : null}
                  {columns.service ? <th className="px-4 py-3">Service</th> : null}
                  {columns.compliance ? <th className="px-4 py-3">Compliance</th> : null}
                  {columns.maintenance ? <th className="px-4 py-3">Maintenance</th> : null}
                  <th className="w-14 px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {pageItems.map((item) => (
                  <tr key={item.id} className="border-b border-[var(--psm-line)] transition hover:bg-[var(--psm-surface-2)]">
                    <td className="px-4 py-4"><input type="checkbox" checked={selected.has(item.id)} onChange={() => toggleSelected(item.id)} aria-label={`Select ${item.tag}`} /></td>
                    {columns.tag ? <td className="px-4 py-4 font-semibold text-primary"><a href={`/equipment/${item.id}`}>{item.tag}</a></td> : null}
                    {columns.name ? <td className="px-4 py-4"><div className="font-medium">{item.name}</div><div className="mt-1 text-xs text-[var(--psm-muted)]">{locationLine(item)}</div></td> : null}
                    {columns.type ? <td className="px-4 py-4">{item.type}{item.subtype ? ` - ${item.subtype}` : ''}</td> : null}
                    {columns.status ? <td className="px-4 py-4"><StatusBadge status={item.status} /></td> : null}
                    {columns.criticality ? <td className="px-4 py-4"><RiskBadge criticality={item.criticality} /></td> : null}
                    {columns.service ? <td className="px-4 py-4 text-[var(--psm-muted)]">{item.fluidService ?? item.systemName ?? 'Not specified'}</td> : null}
                    {columns.compliance ? <td className="px-4 py-4"><Compliance score={complianceScore(item)} /></td> : null}
                    {columns.maintenance ? <td className="px-4 py-4"><MaintenanceStatus item={item} /></td> : null}
                    <td className="relative px-4 py-4">
                      <button onClick={() => setMenuOpen(menuOpen === item.id ? null : item.id)} className="rounded-md p-2 text-[var(--psm-muted)] hover:bg-[var(--psm-surface-3)]" aria-label={`More actions for ${item.tag}`}><MoreHorizontal size={16} /></button>
                      {menuOpen === item.id ? <RowMenu item={item} onArchive={() => setArchiveTarget(item)} onClose={() => setMenuOpen(null)} /> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
            {pageItems.map((item) => <EquipmentCard key={item.id} item={item} />)}
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-[var(--psm-line)] p-4 text-sm text-[var(--psm-muted)] md:flex-row md:items-center md:justify-between">
          <div>Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, filtered.length)} of {filtered.length} equipment records</div>
          <div className="flex items-center gap-2">
            <button type="button" className="psm-button psm-button-secondary" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}><ChevronLeft size={16} /> Previous</button>
            <span className="rounded-md border border-[var(--psm-line)] px-3 py-2">Page {page} / {totalPages}</span>
            <button type="button" className="psm-button psm-button-secondary" disabled={page === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>Next <ChevronRight size={16} /></button>
          </div>
        </div>
      </section>
      {archiveTarget ? (
        <ConfirmDialog
          title="Archive equipment?"
          message={`This will move ${archiveTarget.tag} to Decommissioned status. It keeps audit history and linked records intact.`}
          confirmLabel="Archive"
          tone="warning"
          onCancel={() => setArchiveTarget(null)}
          onConfirm={() => archiveEquipment(archiveTarget)}
        />
      ) : null}
    </div>
  );
}

function RowMenu({ item, onArchive, onClose }: { item: Equipment; onArchive: () => void; onClose: () => void }) {
  async function copyTag() {
    await navigator.clipboard.writeText(item.tag);
    onClose();
  }

  return (
    <div className="psm-card absolute right-3 top-12 z-30 w-48 overflow-hidden p-1 text-sm">
      <a href={`/equipment/${item.id}`} className="block rounded-md px-3 py-2 hover:bg-[var(--psm-surface-3)]">View details</a>
      <a href={`/equipment/${item.id}?edit=1`} className="block rounded-md px-3 py-2 hover:bg-[var(--psm-surface-3)]">Edit equipment</a>
      <button type="button" onClick={copyTag} className="block w-full rounded-md px-3 py-2 text-left hover:bg-[var(--psm-surface-3)]">Copy tag</button>
      <button type="button" onClick={onArchive} className="block w-full rounded-md px-3 py-2 text-left text-warning hover:bg-warning/10">Archive equipment</button>
    </div>
  );
}

function Metric({ title, value, caption, tone }: { title: string; value: string | number; caption: string; tone: 'success' | 'warning' | 'danger' | 'info' }) {
  const toneClass = { success: 'text-success', warning: 'text-warning', danger: 'text-danger', info: 'text-info' }[tone];
  return (
    <div className="psm-card p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-[var(--psm-muted)]">{title}</div>
      <div className={`mt-3 text-3xl font-semibold ${toneClass}`}>{value}</div>
      <div className="mt-2 text-sm text-[var(--psm-muted)]">{caption}</div>
    </div>
  );
}

function SortableTh({ label: text, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <th className="px-4 py-3">
      <button type="button" onClick={onClick} className={`inline-flex items-center gap-1 ${active ? 'text-primary' : ''}`}>
        {text} <ArrowDownAZ size={14} />
      </button>
    </th>
  );
}

function EquipmentCard({ item }: { item: Equipment }) {
  const score = complianceScore(item);
  return (
    <a href={`/equipment/${item.id}`} className="psm-card block p-4 transition hover:-translate-y-0.5 hover:shadow-psm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-semibold text-primary">{item.tag}</div>
          <div className="mt-1 text-sm font-medium">{item.name}</div>
          <div className="mt-1 text-xs text-[var(--psm-muted)]">{locationLine(item)}</div>
        </div>
        <RiskBadge criticality={item.criticality} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-lg bg-[var(--psm-surface-2)] p-3"><div className="text-xs text-[var(--psm-muted)]">Status</div><div className="mt-1"><StatusBadge status={item.status} /></div></div>
        <div className="rounded-lg bg-[var(--psm-surface-2)] p-3"><div className="text-xs text-[var(--psm-muted)]">Service</div><div className="mt-1 truncate font-medium">{item.fluidService ?? 'Not set'}</div></div>
      </div>
      <div className="mt-4"><Compliance score={score} /></div>
      <div className="mt-4 flex items-center justify-between border-t border-[var(--psm-line)] pt-3 text-xs text-[var(--psm-muted)]">
        <span>{item.type}{item.subtype ? ` / ${item.subtype}` : ''}</span>
        <MaintenanceStatus item={item} />
      </div>
    </a>
  );
}

function Compliance({ score }: { score: number }) {
  return (
    <div className="min-w-40">
      <div className="mb-1 flex justify-between text-xs"><span className="text-[var(--psm-muted)]">Compliance</span><span className="font-semibold">{score}%</span></div>
      <div className="h-2 overflow-hidden rounded-full bg-[var(--psm-surface-3)]"><div className={`h-full ${score >= 85 ? 'bg-success' : score >= 65 ? 'bg-warning' : 'bg-danger'}`} style={{ width: `${score}%` }} /></div>
    </div>
  );
}

function RiskBadge({ criticality }: { criticality: EquipmentCriticality }) {
  const tone = criticality === 'LOW' ? 'psm-badge-success' : criticality === 'MEDIUM' ? 'psm-badge-warning' : 'psm-badge-danger';
  return <span className={`psm-badge ${tone}`}>{label(criticality)}</span>;
}

function StatusBadge({ status }: { status: EquipmentStatus }) {
  const tone = status === 'ACTIVE' ? 'psm-badge-success' : status === 'INACTIVE' ? 'psm-badge-muted' : status === 'OUT_OF_SERVICE' ? 'psm-badge-warning' : 'psm-badge-danger';
  return <span className={`psm-badge ${tone}`}>{label(status)}</span>;
}

function MaintenanceStatus({ item }: { item: Equipment }) {
  const due = item.maintenancePriority === 'HIGH' || item.rbiPriority === 'HIGH';
  return <span className={`psm-badge ${due ? 'psm-badge-warning' : 'psm-badge-success'}`}>{due ? 'Maintenance Due' : 'Current'}</span>;
}

function complianceScore(item: Equipment) {
  const fields = [item.manufacturer, item.model, item.serialNumber, item.commissionDate, item.designPressure, item.operatingPressure, item.fluidService, item.hazardClass, item.classification, item.areaClassification];
  const filled = fields.filter(Boolean).length;
  return Math.min(100, Math.round((filled / fields.length) * 100));
}

function locationLine(item: Equipment) {
  return [item.site?.name, item.unit?.name, item.area?.name, item.systemName].filter(Boolean).join(' / ') || 'Location not assigned';
}

function label(value: string) {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function getErrorMessage(error: unknown) {
  const responseData = typeof error === 'object' && error && 'response' in error
    ? (error as { response?: { data?: unknown } }).response?.data
    : undefined;
  if (typeof responseData === 'object' && responseData && 'message' in responseData) {
    const message = (responseData as { message?: unknown }).message;
    if (Array.isArray(message)) return message.join(' ');
    if (typeof message === 'string') return message;
  }
  return error instanceof Error ? error.message : 'The request could not be completed.';
}

function RegistrySkeleton() {
  return (
    <div className="space-y-5">
      <div className="h-28 rounded-xl psm-skeleton" />
      <div className="grid gap-3 md:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-28 rounded-xl psm-skeleton" />)}</div>
      <div className="h-[520px] rounded-xl psm-skeleton" />
    </div>
  );
}
