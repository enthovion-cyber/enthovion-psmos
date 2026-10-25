'use client';

import { useState, useMemo } from 'react';
import {
  Building2,
  Factory,
  Layers3,
  MapPinned,
  Users,
  ChevronRight,
  ChevronDown,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Search,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useFoundationMutations } from '@/hooks/useFoundation';
import { useMutationToast } from '@/providers/ToastProvider';
import type { FoundationKind } from '@/services/foundation.service';

type TreeArea = {
  id: string;
  name: string;
  code?: string;
  status?: string;
  description?: string;
  unitId: string;
  areaAuthorityUserId?: string;
  authority?: { id: string; email: string; displayName: string; title?: string } | null;
};

type TreeUnit = {
  id: string;
  name: string;
  code?: string;
  status?: string;
  operatingStatus?: string;
  description?: string;
  siteId: string;
  departmentId?: string;
  unitManagerId?: string;
  manager?: { id: string; email: string; displayName: string; title?: string } | null;
  areas: TreeArea[];
};

type TreeDepartment = {
  id: string;
  name: string;
  code?: string;
  siteId: string;
  description?: string;
};

type TreeSite = {
  id: string;
  name: string;
  code?: string;
  status?: string;
  companyId?: string;
  country?: string;
  timezone?: string;
  departments: TreeDepartment[];
  units: TreeUnit[];
};

type TreeCompany = {
  id: string;
  name: string;
  code?: string;
  industry?: string;
  status?: string;
  sites: TreeSite[];
};

type HierarchyData = {
  tree: TreeCompany[];
  summary: {
    totalCompanies: number;
    totalSites: number;
    totalDepartments: number;
    totalUnits: number;
    totalAreas: number;
  };
};

export function LocationTreeExplorer() {
  const queryClient = useQueryClient();
  const toast = useMutationToast();
  const mutations = useFoundationMutations();

  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  const [selectedNode, setSelectedNode] = useState<{
    level: 'company' | 'site' | 'department' | 'unit' | 'area';
    data: any;
    breadcrumbs: string[];
  } | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [targetKind, setTargetKind] = useState<FoundationKind>('units');
  const [parentId, setParentId] = useState<string>('');
  const [editId, setEditId] = useState<string>('');

  const [form, setForm] = useState({
    name: '',
    code: '',
    description: '',
    status: 'ACTIVE',
    operatingStatus: 'IN_SERVICE',
    unitManagerId: '',
    areaAuthorityUserId: '',
    siteId: '',
    unitId: '',
    companyId: '',
    departmentId: ''
  });

  const { data: hierarchy, isLoading } = useQuery<HierarchyData>({
    queryKey: ['foundation', 'tree'],
    queryFn: async () => {
      const res = await api.get('/foundation/tree');
      return res.data?.data ?? res.data;
    }
  });

  const { data: users = [] } = useQuery({
    queryKey: ['admin', 'users', 'lookup'],
    queryFn: async () => {
      const res = await api.get('/admin/users');
      return res.data?.data ?? res.data ?? [];
    }
  });

  function toggleExpand(id: string) {
    setExpandedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function openCreateModal(kind: FoundationKind, pId: string = '') {
    setModalMode('create');
    setTargetKind(kind);
    setParentId(pId);
    setEditId('');
    setForm({
      name: '',
      code: '',
      description: '',
      status: 'ACTIVE',
      operatingStatus: 'IN_SERVICE',
      unitManagerId: '',
      areaAuthorityUserId: '',
      siteId: kind === 'units' || kind === 'departments' ? pId : '',
      unitId: kind === 'areas' ? pId : '',
      companyId: kind === 'sites' ? pId : '',
      departmentId: ''
    });
    setModalOpen(true);
  }

  function openEditModal(kind: FoundationKind, item: any) {
    setModalMode('edit');
    setTargetKind(kind);
    setEditId(item.id);
    setForm({
      name: item.name ?? '',
      code: item.code ?? '',
      description: item.description ?? '',
      status: item.status ?? 'ACTIVE',
      operatingStatus: item.operatingStatus ?? item.operating_status ?? 'IN_SERVICE',
      unitManagerId: item.unitManagerId ?? item.managerId ?? '',
      areaAuthorityUserId: item.areaAuthorityUserId ?? '',
      siteId: item.siteId ?? '',
      unitId: item.unitId ?? '',
      companyId: item.companyId ?? '',
      departmentId: item.departmentId ?? ''
    });
    setModalOpen(true);
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (modalMode === 'create') {
        await mutations.create.mutateAsync({
          kind: targetKind,
          input: {
            ...form,
            ...(targetKind === 'units' ? { siteId: form.siteId || parentId } : {}),
            ...(targetKind === 'areas' ? { unitId: form.unitId || parentId } : {}),
            ...(targetKind === 'sites' ? { companyId: form.companyId || parentId } : {}),
            ...(targetKind === 'departments' ? { siteId: form.siteId || parentId } : {})
          }
        });
        toast.success(`New ${targetKind.slice(0, -1)} registered`);
      } else {
        await mutations.update.mutateAsync({
          kind: targetKind,
          id: editId,
          input: form
        });
        toast.success(`Updated ${targetKind.slice(0, -1)} record`);
      }
      await queryClient.invalidateQueries({ queryKey: ['foundation', 'tree'] });
      setModalOpen(false);
    } catch (err: any) {
      toast.error('Save failed', err.message || 'Server error');
    }
  }

  const companies = hierarchy?.tree ?? [];

  return (
    <div className="space-y-6">
      {/* Top Banner / Metrics */}
      <section className="psm-card p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-info/10 text-info">
                <Layers3 size={18} />
              </span>
              <h1 className="text-2xl font-bold tracking-tight">Plant Hierarchy & Asset Scoping</h1>
            </div>
            <p className="mt-1 text-sm text-[var(--psm-muted)]">
              Enterprise organizational spine: Company ➔ Site / Plant ➔ Department ➔ Process Unit ➔ Area. Defines multi-site boundary and PTW/MOC SimOps scope.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => openCreateModal('companies')}
              className="psm-button psm-button-secondary text-xs"
            >
              <Plus size={14} /> New Company
            </button>
            <button
              type="button"
              onClick={() => openCreateModal('sites', companies[0]?.id)}
              className="psm-button psm-button-primary text-xs"
            >
              <Plus size={14} /> New Plant / Site
            </button>
          </div>
        </div>

        {/* Summary Metric Chips */}
        {hierarchy?.summary && (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5 border-t border-[var(--psm-line)] pt-4">
            <div className="rounded-lg bg-[var(--psm-surface-2)] p-2.5 text-center">
              <div className="text-xs font-semibold text-[var(--psm-muted)] uppercase">Companies</div>
              <div className="text-xl font-bold text-info">{hierarchy.summary.totalCompanies}</div>
            </div>
            <div className="rounded-lg bg-[var(--psm-surface-2)] p-2.5 text-center">
              <div className="text-xs font-semibold text-[var(--psm-muted)] uppercase">Sites / Plants</div>
              <div className="text-xl font-bold text-success">{hierarchy.summary.totalSites}</div>
            </div>
            <div className="rounded-lg bg-[var(--psm-surface-2)] p-2.5 text-center">
              <div className="text-xs font-semibold text-[var(--psm-muted)] uppercase">Departments</div>
              <div className="text-xl font-bold text-primary">{hierarchy.summary.totalDepartments}</div>
            </div>
            <div className="rounded-lg bg-[var(--psm-surface-2)] p-2.5 text-center">
              <div className="text-xs font-semibold text-[var(--psm-muted)] uppercase">Process Units</div>
              <div className="text-xl font-bold text-amber-500">{hierarchy.summary.totalUnits}</div>
            </div>
            <div className="rounded-lg bg-[var(--psm-surface-2)] p-2.5 text-center">
              <div className="text-xs font-semibold text-[var(--psm-muted)] uppercase">Operating Areas</div>
              <div className="text-xl font-bold text-purple-500">{hierarchy.summary.totalAreas}</div>
            </div>
          </div>
        )}
      </section>

      {/* Main Split View: Nested Tree on Left, Details & Inspection on Right */}
      <div className="grid gap-6 lg:grid-cols-[minmax(340px,440px)_1fr]">
        {/* Tree Explorer Card */}
        <div className="psm-card flex flex-col overflow-hidden">
          <div className="border-b border-[var(--psm-line)] p-4 flex items-center justify-between gap-2">
            <div className="font-semibold text-sm uppercase tracking-wider text-[var(--psm-muted)]">
              Plant Hierarchy Tree
            </div>
            <div className="relative w-44">
              <Search size={14} className="absolute left-2.5 top-2.5 text-[var(--psm-muted)]" />
              <input
                type="text"
                placeholder="Search nodes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="psm-input h-8 w-full pl-8 text-xs"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 max-h-[640px] space-y-1">
            {isLoading ? (
              <div className="p-8 text-center text-sm text-[var(--psm-muted)] animate-pulse">
                Loading plant hierarchy...
              </div>
            ) : !companies.length ? (
              <div className="p-8 text-center text-sm text-[var(--psm-muted)]">
                No hierarchy records registered. Start by creating a Company and Plant.
              </div>
            ) : (
              companies.map((company) => {
                const isExpanded = expandedNodes[company.id] ?? true;
                const isSelected = selectedNode?.data?.id === company.id;

                return (
                  <div key={company.id} className="space-y-1">
                    {/* Company Level */}
                    <div
                      className={`group flex items-center justify-between rounded-lg px-2.5 py-1.5 text-sm cursor-pointer transition ${
                        isSelected
                          ? 'bg-info/15 text-info font-medium'
                          : 'hover:bg-[var(--psm-surface-2)]'
                      }`}
                      onClick={() =>
                        setSelectedNode({
                          level: 'company',
                          data: company,
                          breadcrumbs: [company.name]
                        })
                      }
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand(company.id);
                          }}
                          className="text-[var(--psm-muted)] hover:text-white"
                        >
                          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                        <Building2 size={16} className="text-info shrink-0" />
                        <span className="truncate">{company.name}</span>
                        {company.code && (
                          <span className="text-[10px] font-mono rounded bg-info/10 px-1 text-info">
                            {company.code}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openCreateModal('sites', company.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 rounded p-1 hover:bg-white/10 text-xs"
                        title="Add Site under Company"
                      >
                        <Plus size={13} />
                      </button>
                    </div>

                    {/* Site Level */}
                    {isExpanded && company.sites?.map((site) => {
                      const isSiteExpanded = expandedNodes[site.id] ?? true;
                      const isSiteSelected = selectedNode?.data?.id === site.id;

                      return (
                        <div key={site.id} className="ml-5 pl-2 border-l border-[var(--psm-line)] space-y-1">
                          <div
                            className={`group flex items-center justify-between rounded-lg px-2.5 py-1.5 text-sm cursor-pointer transition ${
                              isSiteSelected
                                ? 'bg-success/15 text-success font-medium'
                                : 'hover:bg-[var(--psm-surface-2)]'
                            }`}
                            onClick={() =>
                              setSelectedNode({
                                level: 'site',
                                data: site,
                                breadcrumbs: [company.name, site.name]
                              })
                            }
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleExpand(site.id);
                                }}
                                className="text-[var(--psm-muted)] hover:text-white"
                              >
                                {isSiteExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                              </button>
                              <Factory size={15} className="text-success shrink-0" />
                              <span className="truncate">{site.name}</span>
                              {site.code && (
                                <span className="text-[10px] font-mono rounded bg-success/10 px-1 text-success">
                                  {site.code}
                                </span>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openCreateModal('units', site.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 rounded p-1 hover:bg-white/10 text-xs"
                              title="Add Process Unit"
                            >
                              <Plus size={13} />
                            </button>
                          </div>

                          {/* Process Unit Level */}
                          {isSiteExpanded && site.units?.map((unit) => {
                            const isUnitExpanded = expandedNodes[unit.id] ?? true;
                            const isUnitSelected = selectedNode?.data?.id === unit.id;
                            const isTAR = unit.operatingStatus === 'TURNAROUND';

                            return (
                              <div key={unit.id} className="ml-5 pl-2 border-l border-[var(--psm-line)] space-y-1">
                                <div
                                  className={`group flex items-center justify-between rounded-lg px-2.5 py-1.5 text-sm cursor-pointer transition ${
                                    isUnitSelected
                                      ? 'bg-amber-500/15 text-amber-400 font-medium'
                                      : 'hover:bg-[var(--psm-surface-2)]'
                                  }`}
                                  onClick={() =>
                                    setSelectedNode({
                                      level: 'unit',
                                      data: unit,
                                      breadcrumbs: [company.name, site.name, unit.name]
                                    })
                                  }
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleExpand(unit.id);
                                      }}
                                      className="text-[var(--psm-muted)] hover:text-white"
                                    >
                                      {isUnitExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                    </button>
                                    <Layers3 size={15} className="text-amber-500 shrink-0" />
                                    <span className="truncate">{unit.name}</span>
                                    {isTAR && (
                                      <span className="rounded bg-amber-500/20 px-1 text-[9px] font-bold text-amber-400">
                                        TAR
                                      </span>
                                    )}
                                  </div>

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openCreateModal('areas', unit.id);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 rounded p-1 hover:bg-white/10 text-xs"
                                    title="Add Area to Unit"
                                  >
                                    <Plus size={13} />
                                  </button>
                                </div>

                                {/* Area Level */}
                                {isUnitExpanded && unit.areas?.map((area) => {
                                  const isAreaSelected = selectedNode?.data?.id === area.id;
                                  return (
                                    <div
                                      key={area.id}
                                      onClick={() =>
                                        setSelectedNode({
                                          level: 'area',
                                          data: area,
                                          breadcrumbs: [company.name, site.name, unit.name, area.name]
                                        })
                                      }
                                      className={`ml-5 flex items-center justify-between rounded-lg px-2.5 py-1 text-xs cursor-pointer transition ${
                                        isAreaSelected
                                          ? 'bg-purple-500/15 text-purple-400 font-medium'
                                          : 'text-[var(--psm-muted)] hover:bg-[var(--psm-surface-2)] hover:text-white'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2 truncate">
                                        <MapPinned size={13} className="text-purple-400 shrink-0" />
                                        <span className="truncate">{area.name}</span>
                                        {area.code && (
                                          <span className="font-mono text-[9px] text-[var(--psm-muted)]">
                                            [{area.code}]
                                          </span>
                                        )}
                                      </div>
                                      {area.authority && (
                                        <span className="text-[10px] text-[var(--psm-muted)] truncate max-w-[90px]">
                                          {area.authority.displayName}
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Node Detail & Control Card */}
        <div className="psm-card p-6 flex flex-col justify-between">
          <div>
            {/* Breadcrumb Trail */}
            <div className="flex items-center gap-1.5 text-xs text-[var(--psm-muted)] flex-wrap mb-4">
              <span className="font-semibold text-white/50">Hierarchy:</span>
              {selectedNode?.breadcrumbs ? (
                selectedNode.breadcrumbs.map((b, idx) => (
                  <span key={idx} className="flex items-center gap-1">
                    {idx > 0 && <ChevronRight size={12} className="text-[var(--psm-muted)]" />}
                    <span className={idx === selectedNode.breadcrumbs.length - 1 ? 'font-bold text-info' : ''}>
                      {b}
                    </span>
                  </span>
                ))
              ) : (
                <span>Select a node in the tree to inspect parameters and safety authority</span>
              )}
            </div>

            {selectedNode ? (
              <div className="space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      {selectedNode.data.name}
                      <span className="text-xs uppercase font-semibold px-2 py-0.5 rounded-full bg-white/10 text-[var(--psm-muted)]">
                        {selectedNode.level}
                      </span>
                    </h2>
                    <p className="mt-1 text-sm text-[var(--psm-muted)]">
                      {selectedNode.data.description || 'No operational description provided.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        openEditModal(
                          selectedNode.level === 'company'
                            ? 'companies'
                            : selectedNode.level === 'site'
                            ? 'sites'
                            : selectedNode.level === 'unit'
                            ? 'units'
                            : selectedNode.level === 'department'
                            ? 'departments'
                            : 'areas',
                          selectedNode.data
                        )
                      }
                      className="psm-button psm-button-secondary text-xs"
                    >
                      <Edit2 size={13} /> Edit Node
                    </button>
                  </div>
                </div>

                {/* Specific Attributes by Level */}
                <div className="grid gap-4 sm:grid-cols-2 bg-[var(--psm-surface-2)] p-4 rounded-xl border border-[var(--psm-line)]">
                  <div>
                    <div className="text-xs text-[var(--psm-muted)] uppercase font-semibold">System Code</div>
                    <div className="mt-0.5 font-mono text-sm">{selectedNode.data.code || 'None'}</div>
                  </div>

                  <div>
                    <div className="text-xs text-[var(--psm-muted)] uppercase font-semibold">Lifecycle Status</div>
                    <div className="mt-0.5 text-sm flex items-center gap-1.5 font-medium text-success">
                      <CheckCircle2 size={14} /> {selectedNode.data.status || 'ACTIVE'}
                    </div>
                  </div>

                  {selectedNode.level === 'unit' && (
                    <>
                      <div>
                        <div className="text-xs text-[var(--psm-muted)] uppercase font-semibold">
                          Operating Mode (SimOps)
                        </div>
                        <div className="mt-0.5">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                              selectedNode.data.operatingStatus === 'TURNAROUND'
                                ? 'bg-amber-500/20 text-amber-400'
                                : selectedNode.data.operatingStatus === 'SHUTDOWN'
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-emerald-500/20 text-emerald-400'
                            }`}
                          >
                            {selectedNode.data.operatingStatus || 'IN_SERVICE'}
                          </span>
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-[var(--psm-muted)] uppercase font-semibold">
                          Unit Superintendent / Manager
                        </div>
                        <div className="mt-0.5 text-sm flex items-center gap-1.5 text-white/90">
                          <UserCheck size={14} className="text-info" />
                          {selectedNode.data.manager?.displayName || 'Unassigned'}
                        </div>
                      </div>
                    </>
                  )}

                  {selectedNode.level === 'area' && (
                    <div className="sm:col-span-2">
                      <div className="text-xs text-[var(--psm-muted)] uppercase font-semibold">
                        Designated Area Authority (PTW / PSSR Gatekeeper)
                      </div>
                      <div className="mt-1 flex items-center gap-2 p-2 rounded-lg bg-[var(--psm-surface-3)]">
                        <ShieldCheck size={16} className="text-purple-400" />
                        <div>
                          <div className="font-semibold text-sm">
                            {selectedNode.data.authority?.displayName || 'No Lead Operator Assigned'}
                          </div>
                          <div className="text-xs text-[var(--psm-muted)]">
                            {selectedNode.data.authority?.title || selectedNode.data.authority?.email || 'Assign an authority in Edit Node'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sub-node summary */}
                {selectedNode.level === 'unit' && (
                  <div>
                    <h3 className="font-semibold text-sm mb-3">Operating Areas in this Unit ({selectedNode.data.areas?.length || 0})</h3>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {selectedNode.data.areas?.map((a: TreeArea) => (
                        <div key={a.id} className="p-3 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface)]">
                          <div className="font-medium text-sm">{a.name}</div>
                          <div className="text-xs text-[var(--psm-muted)] mt-1 flex justify-between">
                            <span>Code: {a.code || '-'}</span>
                            <span>{a.authority?.displayName || 'No Authority'}</span>
                          </div>
                        </div>
                      ))}
                      {!selectedNode.data.areas?.length && (
                        <div className="p-4 text-center text-xs text-[var(--psm-muted)] sm:col-span-2 border border-dashed rounded-lg border-[var(--psm-line)]">
                          No operating areas defined. Click "Add Area" above.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-80 text-center p-6 text-[var(--psm-muted)]">
                <Factory size={48} className="text-white/10 mb-3" />
                <h3 className="text-base font-semibold text-white/70">Select a Location Node</h3>
                <p className="text-sm max-w-sm mt-1">
                  Click any Company, Plant, Process Unit, or Operating Area on the left tree to inspect its live operating state and authorities.
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-[var(--psm-line)] pt-4 mt-6 flex justify-between items-center text-xs text-[var(--psm-muted)]">
            <span>OSHA 1910.119 Process Safety Management Scope</span>
            <span>Real-time Isolation Boundary</span>
          </div>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="psm-card w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold">
              {modalMode === 'create' ? 'Create' : 'Edit'} {targetKind.slice(0, -1).toUpperCase()}
            </h3>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[var(--psm-muted)] uppercase block mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="psm-input h-10 w-full px-3"
                  placeholder="e.g. Crude Distillation Unit 1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--psm-muted)] uppercase block mb-1">
                  Code
                </label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  className="psm-input h-10 w-full px-3 font-mono"
                  placeholder="e.g. CDU-1"
                />
              </div>

              {targetKind === 'units' && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-[var(--psm-muted)] uppercase block mb-1">
                      Operating Status (SimOps)
                    </label>
                    <select
                      value={form.operatingStatus}
                      onChange={(e) => setForm({ ...form, operatingStatus: e.target.value })}
                      className="psm-input h-10 w-full px-3"
                    >
                      <option value="IN_SERVICE">IN_SERVICE (Normal Operation)</option>
                      <option value="SHUTDOWN">SHUTDOWN (Cold Maintenance)</option>
                      <option value="TURNAROUND">TURNAROUND (Major Overhaul)</option>
                      <option value="COMMISSIONING">COMMISSIONING (PSSR Phase)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[var(--psm-muted)] uppercase block mb-1">
                      Unit Superintendent / Manager
                    </label>
                    <select
                      value={form.unitManagerId}
                      onChange={(e) => setForm({ ...form, unitManagerId: e.target.value })}
                      className="psm-input h-10 w-full px-3"
                    >
                      <option value="">Select Manager</option>
                      {users.map((u: any) => (
                        <option key={u.id} value={u.id}>
                          {u.displayName} ({u.email})
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {targetKind === 'areas' && (
                <div>
                  <label className="text-xs font-semibold text-[var(--psm-muted)] uppercase block mb-1">
                    Area Authority Lead Operator (PTW Gatekeeper)
                  </label>
                  <select
                    value={form.areaAuthorityUserId}
                    onChange={(e) => setForm({ ...form, areaAuthorityUserId: e.target.value })}
                    className="psm-input h-10 w-full px-3"
                  >
                    <option value="">Select Lead Operator</option>
                    {users.map((u: any) => (
                      <option key={u.id} value={u.id}>
                        {u.displayName} ({u.title || u.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-[var(--psm-muted)] uppercase block mb-1">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="psm-input min-h-20 w-full p-2.5 text-sm"
                  placeholder="Battery limits, physical boundary, or special hazards..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--psm-line)]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="psm-button psm-button-secondary text-sm"
                >
                  Cancel
                </button>
                <button type="submit" className="psm-button psm-button-primary text-sm">
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
