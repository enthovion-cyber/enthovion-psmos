"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Copy,
  FileDown,
  Filter,
  GitBranch,
  Layers3,
  Plus,
  RotateCcw,
  Search,
  ShieldAlert,
  Trash2,
  X,
  ClipboardList
} from "lucide-react";
import { useMyPermissions } from "@/features/iam/hooks/useIam";
import { cn } from "@/utils/cn";
import {
  useHazopNodeMutations,
  useHazopNodesContext,
  useHazopScenarioMutations,
} from "../../hooks/useHazopNodes";
import { HazopStatusBadge, RiskBadge } from "../shared/HazopBadges";
import { HazopNodesDeviationsLayout } from "../nodes-deviations/HazopNodesDeviationsLayout";
import { HazopNodeSidebar as RealHazopNodeSidebar } from "../nodes-deviations/HazopNodeSidebar";
import { HazopSelectedNodeHeader } from "../nodes-deviations/HazopSelectedNodeHeader";
import { HazopNodeOverviewPanel } from "../nodes-deviations/HazopNodeOverviewPanel";
import { HazopWorksheetToolbar } from "../nodes-deviations/HazopWorksheetToolbar";
import { HazopDeviationWorksheet as RealHazopDeviationWorksheet } from "../nodes-deviations/HazopDeviationWorksheet";
import { AddRecommendationFromScenarioDialog } from "../nodes-deviations/AddRecommendationFromScenarioDialog";
import { HazopWorksheetExportButton } from "../nodes-deviations/HazopWorksheetExportButton";
import { HazopNodeCompletionCard } from "../nodes-deviations/HazopNodeCompletionCard";
import { HazopRiskDistributionCard } from "../nodes-deviations/HazopRiskDistributionCard";
import { HazopRecommendationSummaryCard } from "../nodes-deviations/HazopRecommendationSummaryCard";
import { HazopOpenActionsBlockersCard } from "../nodes-deviations/HazopOpenActionsBlockersCard";
import { AddEditHazopNodeDialog } from "../nodes-deviations/AddEditHazopNodeDialog";

const guidewordFallback = [
  "No",
  "More",
  "Less",
  "As Well As",
  "Part Of",
  "Reverse",
  "Other Than",
  "Early",
  "Late",
  "Before",
  "After",
];
const parameterFallback = [
  "Flow",
  "Pressure",
  "Temperature",
  "Level",
  "Composition",
  "Phase",
  "Reaction",
  "Mixing",
  "Utility",
  "Containment",
  "Startup",
  "Shutdown",
  "Maintenance",
  "Sampling",
  "Drain/Vent",
];

export type HazopNodesInitialAction = { type: "add-node" | "add-scenario" | "add-recommendation"; nonce: number } | null;

export function HazopNodesDeviationsTab({ study, initialAction }: { study: any; initialAction?: HazopNodesInitialAction }) {
  const context = useHazopNodesContext(study.id);
  const nodeMutations = useHazopNodeMutations(study.id);
  const scenarioMutations = useHazopScenarioMutations(study.id);
  const permissionsQuery = useMyPermissions();
  const permissions = permissionsQuery.data ?? [];
  const can = (permission: string) =>
    permissions.includes(permission) || permissions.includes("hazop:manage");
  const readonly = ["Approved", "Closed", "Cancelled"].includes(study.status);

  const [activeNodeId, setActiveNodeId] = useState<string | null>(
    (study.nodes ?? [])[0]?.id ?? null,
  );
  const [query, setQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState("All");
  const [lopaOnly, setLopaOnly] = useState(false);
  const [recommendationFilter, setRecommendationFilter] = useState("All");
  const [nodeDialog, setNodeDialog] = useState<any>(null);
  const [scenarioDialog, setScenarioDialog] = useState<any>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [drawerScenario, setDrawerScenario] = useState<any>(null);
  const [recommendationScenario, setRecommendationScenario] = useState<any>(null);
  const [lopaScenario, setLopaScenario] = useState<any>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [toast, setToast] = useState<{ tone: "success" | "error" | "info"; text: string } | null>(null);
  const notify = (tone: "success" | "error" | "info", text: string) => {
    setToast({ tone, text });
    window.setTimeout(() => setToast(null), 3500);
  };

  const nodes = useMemo(() => enrichNodes(study), [study]);
  const activeNode =
    nodes.find((node) => node.id === activeNodeId) ?? nodes[0] ?? null;
  const activeScenarios = (study.scenarios ?? []).filter(
    (scenario: any) => !activeNode || scenario.node_id === activeNode.id,
  );
  const activeRecommendations = (study.recommendations ?? []).filter((rec: any) =>
    activeScenarios.some((scenario: any) => scenario.id === rec.scenario_id),
  );
  const filteredScenarios = activeScenarios.filter((scenario: any) => {
    const text = [
      scenario.scenario_number,
      scenario.guideword,
      scenario.parameter,
      scenario.deviation_text,
      scenario.cause,
      scenario.consequence,
      scenario.existing_safeguards,
    ]
      .join(" ")
      .toLowerCase();
    if (query && !text.includes(query.toLowerCase())) return false;
    if (riskFilter !== "All" && scenario.risk_level !== riskFilter)
      return false;
    if (lopaOnly && !scenario.lopa_required) return false;
    if (
      recommendationFilter === "Required" &&
      !scenario.recommendation_required
    )
      return false;
    if (
      recommendationFilter === "Open" &&
      !recommendationsFor(study, scenario.id).some(
        (rec: any) => !["Closed", "Cancelled"].includes(rec.status),
      )
    )
      return false;
    return true;
  });

  const openRecommendationDialog = (scenario: any) => {
    setLopaScenario(null);
    setDrawerScenario(null);
    setRecommendationScenario(scenario);
  };

  const openLopaDialog = (scenario: any) => {
    setRecommendationScenario(null);
    setDrawerScenario(null);
    setLopaScenario(scenario);
  };

  const guidewords = (context.data?.guidewords ?? [])
    .map((item: any) => item.name ?? item.guideword ?? item.value)
    .filter(Boolean);
  const parameters = (context.data?.parameters ?? [])
    .map((item: any) => item.name ?? item.parameter ?? item.value)
    .filter(Boolean);
  const activeNodeParameters = (
    activeNode?.selected_parameters?.length
      ? activeNode.selected_parameters
      : activeNode?.parameter_configurations?.map((item: any) => item.parameterName ?? item.parameter_name).filter(Boolean)
  ) ?? [];
  const scenarioParameters = activeNodeParameters.length ? activeNodeParameters : parameters.length ? parameters : parameterFallback;

  useEffect(() => {
    if (!initialAction) return;
    if (initialAction.type === "add-node") {
      setNodeDialog({ mode: "create" });
      return;
    }
    if (initialAction.type === "add-scenario") {
      if (!activeNode) {
        setNotice("Select a node first.");
        return;
      }
      setScenarioDialog({ mode: "create", nodeId: activeNode.id });
      return;
    }
    if (initialAction.type === "add-recommendation") {
      if (!drawerScenario && !filteredScenarios[0]) {
        setNotice("Select a scenario first.");
        return;
      }
      openRecommendationDialog(drawerScenario ?? filteredScenarios[0]);
    }
  }, [initialAction?.nonce]);

  return (
    <div className="space-y-4">
      {toast ? <Toast tone={toast.tone} text={toast.text} onClose={() => setToast(null)} /> : null}
      {context.isError ? (
        <Banner tone="red">
          Unable to load node context. Existing study data remains available.
        </Banner>
      ) : null}
      {readonly ? (
        <Banner tone="amber">
          This HAZOP study is {study.status}. Nodes and scenarios are read-only
          unless reopened by an authorized workflow action.
        </Banner>
      ) : null}
      {notice ? (
        <Banner tone="amber">{notice}</Banner>
      ) : null}
      <HazopNodesDeviationsLayout
        sidebar={
        <RealHazopNodeSidebar
          nodes={nodes}
          activeNodeId={activeNode?.id}
          onSelect={(id) => {
            setActiveNodeId(id);
            setNotice(null);
            if (typeof window !== "undefined") {
              const url = new URL(window.location.href);
              url.searchParams.set("node", id);
              window.history.replaceState(null, "", url.toString());
            }
          }}
          onAdd={() => setNodeDialog({ mode: "create" })}
          onDuplicate={(node: any) =>
            nodeMutations.duplicateNode.mutate(node.id)
          }
          onDelete={(node: any) =>
            confirm(
              "Delete this node? Nodes with scenarios are blocked by the API.",
            ) && nodeMutations.deleteNode.mutate(node.id)
          }
          onMove={(node: any, direction: "up" | "down") => {
            const ids = nodes.map((item) => item.id);
            const index = ids.indexOf(node.id);
            const next = direction === "up" ? index - 1 : index + 1;
            if (next < 0 || next >= ids.length) return;
            [ids[index], ids[next]] = [ids[next], ids[index]];
            nodeMutations.reorderNodes.mutate(ids);
          }}
          canEdit={can("hazop.node.edit") && !readonly}
          canCreate={can("hazop.node.create") && !readonly}
          canDelete={can("hazop.node.delete") && !readonly}
          loading={context.isLoading}
          error={context.isError}
        />
        }
      >
          {!activeNode ? (
            <EmptyState
              title="Add first node"
              text="Create a process node to start the HAZOP worksheet."
              action={
                can("hazop.node.create") && !readonly ? (
                  <button
                    className="btn-primary"
                    onClick={() => setNodeDialog({ mode: "create" })}
                  >
                    Add Node
                  </button>
                ) : null
              }
            />
          ) : (
            <>
              <HazopSelectedNodeHeader
                node={activeNode}
                onEdit={() => setNodeDialog({ mode: "edit", node: activeNode })}
                onAddScenario={() =>
                  setScenarioDialog({ mode: "create", nodeId: activeNode.id })
                }
                onBulk={() => setBulkOpen(true)}
                onComplete={() =>
                  nodeMutations.markNodeComplete.mutate(activeNode.id)
                }
                onReopen={() => nodeMutations.reopenNode.mutate(activeNode.id)}
                canEdit={can("hazop.node.edit") && !readonly}
                canScenario={can("hazop.scenario.create") && !readonly}
              />
              <HazopNodeOverviewPanel node={activeNode} />
              <HazopWorksheetToolbar
                query={query}
                onQuery={setQuery}
                riskFilter={riskFilter}
                onRiskFilter={setRiskFilter}
                lopaOnly={lopaOnly}
                onLopaOnly={setLopaOnly}
                recommendationFilter={recommendationFilter}
                onRecommendationFilter={setRecommendationFilter}
                onAddScenario={() => setScenarioDialog({ mode: "create", nodeId: activeNode.id })}
                extra={<HazopWorksheetExportButton study={study} node={activeNode} scenarios={filteredScenarios} />}
              />
              <RealHazopDeviationWorksheet
                scenarios={filteredScenarios}
                recommendationCountFor={(scenarioId) => recommendationsFor(study, scenarioId).length}
                actions={{
                  onOpen: setDrawerScenario,
                  onEdit: (scenario: any) => setScenarioDialog({ mode: "edit", scenario, nodeId: scenario.node_id }),
                  onAddRecommendation: openRecommendationDialog,
                  onAddSafeguard: (scenario: any) => setDrawerScenario(scenario),
                  onRankRisk: (scenario: any) => setScenarioDialog({ mode: "edit", scenario, nodeId: scenario.node_id }),
                  onMarkLopa: openLopaDialog,
                  onDuplicate: (scenario: any) => scenarioMutations.duplicateScenario.mutate(scenario.id),
                  onDelete: (scenario: any) => confirm("Delete this scenario row?") && scenarioMutations.deleteScenario.mutate(scenario.id),
                }}
                canEdit={can("hazop.scenario.edit") && !readonly}
                canDelete={can("hazop.scenario.delete") && !readonly}
              />
              <div className="grid gap-4 xl:grid-cols-4">
                <HazopNodeCompletionCard node={activeNode} scenarios={activeScenarios} />
                <HazopRiskDistributionCard scenarios={activeScenarios} />
                <HazopRecommendationSummaryCard recommendations={activeRecommendations} onOpen={() => setNotice("Open the Recommendations / Actions tab for the full register.")} />
                <HazopOpenActionsBlockersCard recommendations={activeRecommendations} />
              </div>
            </>
          )}
      </HazopNodesDeviationsLayout>

      {nodeDialog ? (
        <AddEditHazopNodeDialog
          state={nodeDialog}
          context={context.data}
          saving={nodeMutations.addNode.isPending || nodeMutations.updateNode.isPending}
          canOverrideHierarchy={can("hazop.study.admin") || can("hazop.node.override_scope")}
          canCreateCustomParameter={can("hazop.parameters.custom.create") || can("hazop.process_safety.admin")}
          canOpenRegistry={can("equipment.view")}
          canOpenDocuments={can("documents.view")}
          onCreateCustomParameter={(values) => nodeMutations.createCustomParameter.mutate(values)}
          onClose={() => setNodeDialog(null)}
          onSubmit={(values: Record<string, any>, addAnother: boolean) => {
            if (nodeDialog.mode === "edit")
              nodeMutations.updateNode.mutate({
                nodeId: nodeDialog.node.id,
                values,
              }, { onSuccess: (node: any) => { setActiveNodeId(node.id); notify("success", "Node saved."); }, onError: (error: any) => notify("error", error?.message ?? "Node save failed.") });
            else
              nodeMutations.addNode.mutate(values, {
                onSuccess: (node: any) => {
                  setActiveNodeId(node.id);
                  notify("success", "Node created.");
                },
                onError: (error: any) => notify("error", error?.message ?? "Node creation failed."),
              });
            if (!addAnother) setNodeDialog(null);
          }}
        />
      ) : null}

      {scenarioDialog ? (
        <AddHazopScenarioDialog
          state={scenarioDialog}
          nodes={nodes}
          guidewords={guidewords.length ? guidewords : guidewordFallback}
          parameters={scenarioParameters}
          users={context.data?.users ?? []}
          saving={scenarioMutations.addScenario.isPending || scenarioMutations.updateScenario.isPending}
          onClose={() => setScenarioDialog(null)}
          onSubmit={(values: Record<string, any>, addAnother: boolean) => {
            if (scenarioDialog.mode === "edit")
              scenarioMutations.updateScenario.mutate({
                scenarioId: scenarioDialog.scenario.id,
                values,
              }, {
                onSuccess: (scenario: any) => {
                  setDrawerScenario(scenario);
                  notify("success", "Scenario saved.");
                  setScenarioDialog(null);
                },
                onError: (error: any) => notify("error", error?.message ?? "Scenario save failed."),
              });
            else scenarioMutations.addScenario.mutate(values, {
              onSuccess: (scenario: any) => {
                setNotice(null);
                setDrawerScenario(scenario);
                if (!addAnother) setScenarioDialog(null);
                notify("success", "Scenario created.");
              },
              onError: (error: any) => notify("error", error?.message ?? "Scenario creation failed."),
            });
          }}
        />
      ) : null}

      {recommendationScenario ? (
        <AddRecommendationFromScenarioDialog
          scenario={recommendationScenario}
          node={nodes.find((node: any) => node.id === recommendationScenario.node_id)}
          users={context.data?.users ?? []}
          saving={scenarioMutations.addRecommendation?.isPending}
          onClose={() => setRecommendationScenario(null)}
          onSubmit={(values: Record<string, any>) => {
            scenarioMutations.addRecommendation.mutate(values, {
              onSuccess: () => {
                setRecommendationScenario(null);
                setNotice(null);
                notify("success", "Recommendation created and linked to scenario.");
              },
              onError: (error: any) => notify("error", error?.message ?? "Recommendation save failed."),
            });
          }}
        />
      ) : null}

      {lopaScenario ? (
        <MarkLopaRequiredDialog
          scenario={lopaScenario}
          saving={scenarioMutations.markLopaRequired.isPending}
          onClose={() => setLopaScenario(null)}
          onSubmit={(values: Record<string, any>) => {
            scenarioMutations.markLopaRequired.mutate({
              scenarioId: lopaScenario.id,
              reason: `${values.source}: ${values.reason}${values.requiredBy ? ` | Required by ${values.requiredBy}` : ""}${values.dueDate ? ` | Due ${values.dueDate}` : ""}${values.notes ? ` | ${values.notes}` : ""}`,
            }, {
              onSuccess: (scenario: any) => {
                setLopaScenario(null);
                setDrawerScenario(scenario);
                notify("success", "LOPA requirement saved.");
              },
              onError: (error: any) => notify("error", error?.message ?? "LOPA update failed."),
            });
          }}
        />
      ) : null}

      {bulkOpen && activeNode ? (
        <BulkGenerateDeviationsDialog
          node={activeNode}
          guidewords={guidewords.length ? guidewords : guidewordFallback}
          parameters={scenarioParameters}
          onClose={() => setBulkOpen(false)}
          onSubmit={(values: Record<string, any>) => {
            scenarioMutations.bulkGenerate.mutate({
              ...values,
              nodeId: activeNode.id,
            }, {
              onSuccess: () => {
                setBulkOpen(false);
                notify("success", "Draft deviations generated.");
              },
              onError: (error: any) => notify("error", error?.message ?? "Bulk generation failed."),
            });
          }}
        />
      ) : null}

      {drawerScenario ? (
        <HazopScenarioDetailDrawer
          study={study}
          scenario={drawerScenario}
          node={nodes.find((node: any) => node.id === drawerScenario.node_id)}
          users={context.data?.users ?? []}
          canEdit={can("hazop.scenario.edit") && !readonly}
          canRisk={can("hazop.risk.edit") && !readonly}
          canRecommend={can("hazop.recommendation.create") && !readonly}
          onClose={() => setDrawerScenario(null)}
          onSave={(values: Record<string, any>) =>
            scenarioMutations.updateScenario.mutate({
              scenarioId: drawerScenario.id,
              values,
            }, {
              onSuccess: (scenario: any) => {
                setDrawerScenario(scenario);
                notify("success", "Scenario saved.");
              },
              onError: (error: any) => notify("error", error?.message ?? "Scenario save failed."),
            })
          }
          onAddRecommendation={() => openRecommendationDialog(drawerScenario)}
          onMarkLopa={() => openLopaDialog(drawerScenario)}
          onCloseScenario={() =>
            scenarioMutations.closeScenario.mutate(drawerScenario.id, {
              onSuccess: (scenario: any) => {
                setDrawerScenario(scenario);
                notify("success", "Scenario closed.");
              },
              onError: (error: any) => notify("error", error?.message ?? "Scenario close failed."),
            })
          }
        />
      ) : null}
    </div>
  );
}

function NodeSidebar({
  nodes,
  activeNodeId,
  onSelect,
  onAdd,
  onDuplicate,
  onDelete,
  onMove,
  canEdit,
  canCreate,
  canDelete,
}: any) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [riskFilter, setRiskFilter] = useState("All");
  const filteredNodes = nodes.filter((node: any) => {
    const text = [node.node_number, node.title, node.design_intent, node.process_section, ...(node.equipment_ids ?? [])]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    if (search && !text.includes(search.toLowerCase())) return false;
    if (statusFilter !== "All" && node.status !== statusFilter) return false;
    if (riskFilter !== "All" && node.highestRisk !== riskFilter) return false;
    return true;
  });
  return (
    <aside className="sticky top-4 flex max-h-[calc(100vh-140px)] min-h-[620px] flex-col overflow-hidden rounded-xl border border-[var(--psm-line)] bg-[#061827] shadow-2xl shadow-black/20">
      <div className="border-b border-white/10 p-3">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Nodes ({nodes.length})</h3>
            <p className="text-[11px] text-slate-500">Real study worksheet sections</p>
          </div>
          <div className="flex items-center gap-1">
            <button className="rounded-md border border-white/10 p-1.5 text-slate-400 hover:text-slate-100" title="Filter nodes">
              <Filter size={13} />
            </button>
            {canCreate ? (
              <button className="rounded-md border border-white/10 p-1.5 text-slate-400 hover:text-slate-100" title="Add node" onClick={onAdd}>
                <Plus size={13} />
              </button>
            ) : null}
          </div>
        </div>
        <div className="relative">
          <Search size={13} className="pointer-events-none absolute left-2 top-2.5 text-slate-500" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-8 w-full rounded-md border border-white/10 bg-black/20 pl-7 pr-2 text-xs text-slate-100 outline-none placeholder:text-slate-500 focus:border-primary/60"
            placeholder="Search nodes..."
          />
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-8 rounded-md border border-white/10 bg-black/20 px-2 text-xs text-slate-200 outline-none">
            {["All", "Draft", "In Progress", "Reviewed", "Completed", "Needs Rework", "Closed"].map((status) => <option key={status}>{status}</option>)}
          </select>
          <select value={riskFilter} onChange={(event) => setRiskFilter(event.target.value)} className="h-8 rounded-md border border-white/10 bg-black/20 px-2 text-xs text-slate-200 outline-none">
            {["All", "Critical", "High", "Medium", "Low"].map((risk) => <option key={risk}>{risk}</option>)}
          </select>
        </div>
      </div>
      <div className="flex-1 space-y-1 overflow-y-auto p-2">
        {filteredNodes.map((node: any, index: number) => (
          <div
            key={node.id}
            role="button"
            tabIndex={0}
            onClick={() => onSelect(node.id)}
            onKeyDown={(event) => event.key === "Enter" && onSelect(node.id)}
            className={cn(
              "group rounded-lg border p-3 text-left transition",
              activeNodeId === node.id
                ? "border-blue-400/70 bg-blue-500/10 shadow-[inset_3px_0_0_rgba(59,130,246,.9)]"
                : "border-transparent hover:border-white/10 hover:bg-white/[.04]",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[11px] font-medium text-slate-400">Node {node.node_number ?? index + 1}</div>
                <div className="mt-1 truncate text-sm font-semibold text-slate-100">{node.title}</div>
                <div className="mt-1 truncate text-[11px] text-slate-500">{node.equipmentLabel ?? node.process_section ?? node.design_intent ?? "No equipment linked"}</div>
              </div>
              <CheckCircle2 size={14} className={node.status === "Completed" ? "text-emerald-300" : "text-slate-500"} />
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2 text-center">
              <SidebarMetric icon={<Layers3 size={12} />} label="Scenarios" value={node.scenarioCount} tone="text-sky-300" />
              <SidebarMetric icon={<AlertTriangle size={12} />} label="High Risk" value={node.highRiskCount} tone="text-red-300" />
              <SidebarMetric icon={<ClipboardList size={12} />} label="Open Recs" value={node.openRecommendationCount} tone="text-amber-300" />
              <SidebarMetric icon={<ShieldAlert size={12} />} label="LOPA Req." value={node.lopaRequiredCount} tone="text-purple-300" />
            </div>
            <div className="mt-3 flex items-center gap-2">
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-emerald-400" style={{ width: `${node.completionPercent ?? 0}%` }} />
              </div>
              <span className="text-[10px] text-slate-500">{node.completionPercent ?? 0}%</span>
            </div>
            <div className="mt-2 hidden items-center gap-1 group-hover:flex">
              {canEdit ? <TinyButton label="Up" disabled={index === 0} onClick={(event: any) => { event.stopPropagation(); onMove(node, "up"); }}><ArrowUp size={12} /></TinyButton> : null}
              {canEdit ? <TinyButton label="Down" disabled={index === filteredNodes.length - 1} onClick={(event: any) => { event.stopPropagation(); onMove(node, "down"); }}><ArrowDown size={12} /></TinyButton> : null}
              {canCreate ? <TinyButton label="Duplicate" onClick={(event: any) => { event.stopPropagation(); onDuplicate(node); }}><Copy size={12} /></TinyButton> : null}
              {canDelete ? <TinyButton label="Delete" onClick={(event: any) => { event.stopPropagation(); onDelete(node); }}><Trash2 size={12} /></TinyButton> : null}
            </div>
          </div>
        ))}
        {!filteredNodes.length ? <EmptyState title="No nodes found" text="Adjust search or filters to show nodes." /> : null}
      </div>
      {canCreate ? (
        <div className="border-t border-white/10 p-2">
          <button onClick={onAdd} className="flex h-10 w-full items-center justify-center gap-2 rounded-md border border-white/10 bg-white/[.03] text-xs font-semibold text-slate-200 transition hover:border-primary/50 hover:bg-primary/10">
            <Plus size={13} /> Add New Node
          </button>
        </div>
      ) : null}
    </aside>
  );
}

function SidebarMetric({ icon, label, value, tone }: { icon: ReactNode; label: string; value: number; tone: string }) {
  return (
    <div>
      <div className={`flex items-center justify-center gap-1 text-xs font-semibold ${tone}`}>{icon}{value ?? 0}</div>
      <div className="mt-0.5 truncate text-[10px] text-slate-500">{label}</div>
    </div>
  );
}

function NodeHeader({
  node,
  onEdit,
  onAddScenario,
  onBulk,
  onComplete,
  onReopen,
  canEdit,
  canScenario,
}: any) {
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-primary/40 bg-primary/10 px-2 py-1 text-xs font-bold text-primary">
              {node.node_number}
            </span>
            <HazopStatusBadge value={node.status} />
            {node.lopaRequiredCount ? (
              <Badge tone="purple">
                LOPA Required {node.lopaRequiredCount}
              </Badge>
            ) : null}
          </div>
          <h2 className="mt-2 text-2xl font-semibold">{node.title}</h2>
          <p className="mt-1 max-w-3xl text-sm text-[var(--psm-muted)]">
            {node.design_intent ?? "Design intent not captured."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--psm-muted)]">
            <span>{node.unit_id ?? "No unit"}</span>
            <span>{node.area_id ?? "No area"}</span>
            <span>{node.equipmentCount} equipment tags</span>
            <span>{node.documentCount} P&ID references</span>
            <span>Highest risk: {node.highestRisk ?? "None"}</span>
            <span>Open recs: {node.openRecommendationCount}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {canEdit ? (
            <ActionButton onClick={onEdit}>Edit Node</ActionButton>
          ) : null}
          {canScenario ? (
            <ActionButton primary onClick={onAddScenario}>
              Add Scenario
            </ActionButton>
          ) : null}
          {canScenario ? (
            <ActionButton onClick={onBulk}>Bulk Generate</ActionButton>
          ) : null}
          {canEdit && node.status !== "Completed" ? (
            <ActionButton onClick={onComplete}>Mark Complete</ActionButton>
          ) : null}
          {canEdit && node.status === "Completed" ? (
            <ActionButton onClick={onReopen}>Reopen Node</ActionButton>
          ) : null}
          <ActionButton onClick={() => window.print()}>
            <FileDown size={14} /> Export Node
          </ActionButton>
        </div>
      </div>
    </section>
  );
}

function NodeDetailsPanel({ node, context }: { node: any; context: any }) {
  const equipmentLabels = labelsFromIds(
    context?.equipment ?? [],
    node.equipment_ids,
    "tag",
    "name",
  );
  const documentLabels = labelsFromIds(
    context?.documents ?? [],
    [...(node.document_ids ?? []), ...(node.pid_references ?? [])],
    "document_number",
    "title",
  );
  const process = node.process_conditions_json ?? {};
  return (
    <section className="grid gap-4 xl:grid-cols-4">
      <InfoCard
        title="Design Intent"
        icon={Layers3}
        lines={[node.description, node.design_intent]}
      />
      <InfoCard
        title="Operating Conditions"
        icon={GitBranch}
        lines={[
          node.normal_operating_conditions,
          node.process_conditions,
          `Pressure: ${process.pressure ?? "-"}`,
          `Temperature: ${process.temperature ?? "-"}`,
          `Flow: ${process.flow ?? "-"}`,
          `Level: ${process.level ?? "-"}`,
          `Composition: ${process.composition ?? "-"}`,
          `Phase: ${process.phase ?? "-"}`,
        ]}
      />
      <InfoCard
        title="Equipment & P&ID"
        icon={FileDown}
        lines={[
          ...(equipmentLabels.length
            ? equipmentLabels
            : ["No equipment linked"]),
          ...(documentLabels.length
            ? documentLabels
            : ["No P&ID references linked"]),
        ]}
      />
      <InfoCard
        title="Boundaries"
        icon={ShieldAlert}
        lines={[
          node.boundaries,
          node.assumptions ? `Assumptions: ${node.assumptions}` : null,
          node.exclusions ? `Exclusions: ${node.exclusions}` : null,
        ]}
      />
    </section>
  );
}

function WorksheetFilters({
  query,
  setQuery,
  riskFilter,
  setRiskFilter,
  lopaOnly,
  setLopaOnly,
  recommendationFilter,
  setRecommendationFilter,
}: any) {
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-3">
      <div className="grid gap-3 lg:grid-cols-[1fr_160px_180px_auto]">
        <label className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--psm-muted)]" />
          <input
            className="input pl-9"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search cause, consequence, safeguard, deviation..."
          />
        </label>
        <select
          className="input"
          value={riskFilter}
          onChange={(event) => setRiskFilter(event.target.value)}
        >
          <option>All</option>
          <option>Critical</option>
          <option>High</option>
          <option>Medium</option>
          <option>Low</option>
        </select>
        <select
          className="input"
          value={recommendationFilter}
          onChange={(event) => setRecommendationFilter(event.target.value)}
        >
          <option>All</option>
          <option>Required</option>
          <option>Open</option>
        </select>
        <label className="flex items-center justify-center gap-2 rounded-lg border border-[var(--psm-line)] px-3 py-2 text-sm">
          <input
            type="checkbox"
            checked={lopaOnly}
            onChange={(event) => setLopaOnly(event.target.checked)}
          />{" "}
          LOPA only
        </label>
      </div>
    </section>
  );
}

function DeviationWorksheet({
  study,
  scenarios,
  onOpen,
  onEdit,
  onDuplicate,
  onDelete,
  canEdit,
  canDelete,
}: any) {
  return (
    <section className="overflow-hidden rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)]">
      <div className="flex items-center justify-between border-b border-[var(--psm-line)] p-4">
        <div>
          <h3 className="font-semibold">HAZOP Worksheet</h3>
          <p className="text-xs text-[var(--psm-muted)]">
            {scenarios.length} visible rows · backend-calculated risk
          </p>
        </div>
        <Filter size={16} className="text-[var(--psm-muted)]" />
      </div>
      <div className="max-h-[640px] overflow-auto">
        <table className="w-full min-w-[1680px] text-sm">
          <thead className="sticky top-0 z-10 bg-[var(--psm-surface-2)] text-xs uppercase text-[var(--psm-muted)]">
            <tr>
              {[
                "#",
                "Guideword",
                "Parameter",
                "Deviation",
                "Cause",
                "Consequence",
                "Existing safeguards",
                "Severity",
                "Likelihood",
                "Initial risk",
                "Rec required",
                "Rec count",
                "LOPA",
                "Status",
                "Owner",
                "Actions",
              ].map((head) => (
                <th key={head} className="px-3 py-3 text-left">
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {scenarios.map((scenario: any, index: number) => {
              const recs = recommendationsFor(study, scenario.id);
              return (
                <tr
                  key={scenario.id}
                  className="border-t border-[var(--psm-line)] hover:bg-[var(--psm-surface-2)]"
                >
                  <td
                    onClick={() => onOpen(scenario)}
                    className="cursor-pointer px-3 py-3 font-semibold"
                  >
                    {scenario.row_number ?? index + 1}
                  </td>
                  <td className="px-3 py-3">
                    <Badge>{scenario.guideword ?? "-"}</Badge>
                  </td>
                  <td className="px-3 py-3">
                    <Badge tone="blue">{scenario.parameter ?? "-"}</Badge>
                  </td>
                  <td
                    onClick={() => onOpen(scenario)}
                    className="max-w-[180px] cursor-pointer px-3 py-3 font-medium"
                  >
                    {scenario.deviation_text ?? "-"}
                  </td>
                  <td className="max-w-[240px] px-3 py-3 text-[var(--psm-muted)]">
                    {scenario.cause}
                  </td>
                  <td className="max-w-[260px] px-3 py-3 text-[var(--psm-muted)]">
                    {scenario.consequence}
                  </td>
                  <td className="max-w-[220px] px-3 py-3 text-[var(--psm-muted)]">
                    {scenario.existing_safeguards ?? "Not captured"}
                  </td>
                  <td className="px-3 py-3">{scenario.severity}</td>
                  <td className="px-3 py-3">{scenario.likelihood}</td>
                  <td className="px-3 py-3">
                    <RiskBadge value={scenario.risk_level} />
                  </td>
                  <td className="px-3 py-3">
                    {scenario.recommendation_required ? (
                      <Badge tone="amber">Required</Badge>
                    ) : (
                      <Badge tone="green">No</Badge>
                    )}
                  </td>
                  <td className="px-3 py-3">{recs.length}</td>
                  <td className="px-3 py-3">
                    {scenario.lopa_required ? (
                      <Badge tone="purple">LOPA</Badge>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <HazopStatusBadge value={scenario.status} />
                  </td>
                  <td className="px-3 py-3">{scenario.owner_id ?? "-"}</td>
                  <td className="px-3 py-3">
                    <div className="flex gap-1">
                      <TinyButton label="Open" onClick={() => onOpen(scenario)}>
                        <Search size={12} />
                      </TinyButton>
                      {canEdit ? (
                        <TinyButton
                          label="Edit"
                          onClick={() => onEdit(scenario)}
                        >
                          <CheckCircle2 size={12} />
                        </TinyButton>
                      ) : null}
                      {canEdit ? (
                        <TinyButton
                          label="Duplicate"
                          onClick={() => onDuplicate(scenario)}
                        >
                          <Copy size={12} />
                        </TinyButton>
                      ) : null}
                      {canDelete ? (
                        <TinyButton
                          label="Delete"
                          onClick={() => onDelete(scenario)}
                        >
                          <Trash2 size={12} />
                        </TinyButton>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {!scenarios.length ? (
        <div className="p-4">
          <EmptyState
            title="Add first deviation"
            text="No worksheet rows match this node/filter. Add a scenario or bulk-generate draft deviations."
          />
        </div>
      ) : null}
    </section>
  );
}

function AddHazopNodeDialog({ state, context, onClose, onSubmit }: any) {
  const source = state.node ?? {};
  const [form, setForm] = useState<Record<string, any>>({
    title: source.title ?? "",
    description: source.description ?? "",
    designIntent: source.design_intent ?? "",
    unitId: source.unit_id ?? "",
    areaId: source.area_id ?? "",
    equipmentIds: source.equipment_ids ?? [],
    documentIds: source.document_ids ?? [],
    pidReferences: source.pid_references ?? [],
    normalOperatingConditions: source.normal_operating_conditions ?? "",
    processConditions: source.process_conditions ?? "",
    processConditionsJson: source.process_conditions_json ?? {},
    relatedChemicalIds: source.related_chemical_ids ?? [],
    boundaries: source.boundaries ?? "",
    assumptions: source.assumptions ?? "",
    exclusions: source.exclusions ?? "",
    sortOrder: source.sort_order ?? undefined,
  });
  const errors = [
    !form.title ? "Node title is required" : null,
    !form.designIntent ? "Design intent is required" : null,
    !form.equipmentIds?.length
      ? "Equipment or process section is required"
      : null,
  ].filter(Boolean);
  return (
    <Modal
      title={state.mode === "edit" ? "Edit HAZOP Node" : "Add HAZOP Node"}
      onClose={onClose}
    >
      <div className="grid gap-3 lg:grid-cols-2">
        <Field label="Node title" required>
          <input
            className="input"
            value={form.title}
            onChange={(e) => setValue(setForm, "title", e.target.value)}
          />
        </Field>
        <Field label="Sort order">
          <input
            className="input"
            type="number"
            value={form.sortOrder ?? ""}
            onChange={(e) =>
              setValue(setForm, "sortOrder", Number(e.target.value))
            }
          />
        </Field>
        <Field label="Description">
          <textarea
            className="input min-h-[90px]"
            value={form.description}
            onChange={(e) => setValue(setForm, "description", e.target.value)}
          />
        </Field>
        <Field label="Design intent" required>
          <textarea
            className="input min-h-[90px]"
            value={form.designIntent}
            onChange={(e) => setValue(setForm, "designIntent", e.target.value)}
          />
        </Field>
        <Field label="Unit">
          <input
            className="input"
            value={form.unitId}
            onChange={(e) => setValue(setForm, "unitId", e.target.value)}
            placeholder="Unit ID"
          />
        </Field>
        <Field label="Area">
          <input
            className="input"
            value={form.areaId}
            onChange={(e) => setValue(setForm, "areaId", e.target.value)}
            placeholder="Area ID"
          />
        </Field>
        <Field label="Equipment tags" required>
          <MultiSelect
            values={form.equipmentIds}
            options={(context?.equipment ?? []).map((e: any) => ({
              value: e.id,
              label: `${e.tag} - ${e.name}`,
            }))}
            onChange={(values) => setValue(setForm, "equipmentIds", values)}
          />
        </Field>
        <Field label="P&ID documents">
          <MultiSelect
            values={form.documentIds}
            options={(context?.documents ?? []).map((d: any) => ({
              value: d.id,
              label: `${d.document_number ?? ""} ${d.title}`.trim(),
            }))}
            onChange={(values) => {
              setValue(setForm, "documentIds", values);
              setValue(setForm, "pidReferences", values);
            }}
          />
        </Field>
        <Field label="Normal operating conditions">
          <textarea
            className="input min-h-[80px]"
            value={form.normalOperatingConditions}
            onChange={(e) =>
              setValue(setForm, "normalOperatingConditions", e.target.value)
            }
          />
        </Field>
        <Field label="Process conditions">
          <textarea
            className="input min-h-[80px]"
            value={form.processConditions}
            onChange={(e) =>
              setValue(setForm, "processConditions", e.target.value)
            }
          />
        </Field>
        {[
          "pressure",
          "temperature",
          "flow",
          "level",
          "composition",
          "phase",
        ].map((key) => (
          <Field key={key} label={title(key)}>
            <input
              className="input"
              value={form.processConditionsJson?.[key] ?? ""}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  processConditionsJson: {
                    ...(current.processConditionsJson ?? {}),
                    [key]: e.target.value,
                  },
                }))
              }
            />
          </Field>
        ))}
        <Field label="Boundaries">
          <textarea
            className="input min-h-[80px]"
            value={form.boundaries}
            onChange={(e) => setValue(setForm, "boundaries", e.target.value)}
          />
        </Field>
        <Field label="Assumptions">
          <textarea
            className="input min-h-[80px]"
            value={form.assumptions}
            onChange={(e) => setValue(setForm, "assumptions", e.target.value)}
          />
        </Field>
        <Field label="Exclusions">
          <textarea
            className="input min-h-[80px]"
            value={form.exclusions}
            onChange={(e) => setValue(setForm, "exclusions", e.target.value)}
          />
        </Field>
      </div>
      {errors.length ? (
        <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
          {errors.join(" · ")}
        </div>
      ) : null}
      <div className="mt-5 flex justify-end gap-2">
        <ActionButton onClick={onClose}>Cancel</ActionButton>
        {state.mode !== "edit" ? (
          <ActionButton
            disabled={Boolean(errors.length)}
            onClick={() => onSubmit(form, true)}
          >
            Save and Add Another
          </ActionButton>
        ) : null}
        <ActionButton
          primary
          disabled={Boolean(errors.length)}
          onClick={() => onSubmit(form, false)}
        >
          Save Node
        </ActionButton>
      </div>
    </Modal>
  );
}

function AddHazopScenarioDialog({
  state,
  nodes,
  guidewords,
  parameters,
  users,
  saving,
  onClose,
  onSubmit,
}: any) {
  const source = state.scenario ?? {};
  const [form, setForm] = useState<Record<string, any>>({
    nodeId: state.nodeId ?? source.node_id ?? "",
    guideword: source.guideword ?? guidewords[0] ?? "",
    parameter: source.parameter ?? parameters[0] ?? "",
    deviationText: source.deviation_text ?? "",
    cause: source.cause ?? "",
    consequence: source.consequence ?? "",
    existingSafeguards: source.existing_safeguards ?? "",
    severity: source.severity ?? 3,
    likelihood: source.likelihood ?? 3,
    residualSeverity: source.residual_severity ?? "",
    residualLikelihood: source.residual_likelihood ?? "",
    recommendationRequired: source.recommendation_required ?? false,
    lopaRequired: source.lopa_required ?? false,
    lopaTriggerReason: source.lopa_trigger_reason ?? "",
    ownerId: source.owner_id ?? "",
    status: source.status ?? "Open",
    notes: source.notes ?? "",
  });
  const deviation =
    form.deviationText || autoDeviation(form.guideword, form.parameter);
  const errors = [
    !form.nodeId ? "Node is required" : null,
    !form.cause ? "Cause is required" : null,
    !form.consequence ? "Consequence is required" : null,
  ].filter(Boolean);
  const payload = () => normalizeScenarioPayload({ ...form, deviationText: deviation });
  return (
    <Modal
      title={
        state.mode === "edit" ? "Edit Scenario Row" : "Add Deviation / Scenario"
      }
      onClose={onClose}
    >
      <div className="grid gap-3 lg:grid-cols-3">
        <Field label="Node" required>
          <select
            className="input"
            value={form.nodeId}
            onChange={(e) => setValue(setForm, "nodeId", e.target.value)}
          >
            {nodes.map((node: any) => (
              <option key={node.id} value={node.id}>
                {node.node_number} {node.title}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Guideword">
          <select
            className="input"
            value={form.guideword}
            onChange={(e) => setValue(setForm, "guideword", e.target.value)}
          >
            {guidewords.map((item: string) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </Field>
        <Field label="Parameter">
          <select
            className="input"
            value={form.parameter}
            onChange={(e) => setValue(setForm, "parameter", e.target.value)}
          >
            {parameters.map((item: string) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </Field>
        <Field label="Deviation text">
          <input
            className="input"
            value={deviation}
            onChange={(e) => setValue(setForm, "deviationText", e.target.value)}
          />
        </Field>
        <Field label="Initial severity">
          <input
            className="input"
            type="number"
            min={1}
            max={5}
            value={form.severity}
            onChange={(e) =>
              setValue(setForm, "severity", Number(e.target.value))
            }
          />
        </Field>
        <Field label="Initial likelihood">
          <input
            className="input"
            type="number"
            min={1}
            max={5}
            value={form.likelihood}
            onChange={(e) =>
              setValue(setForm, "likelihood", Number(e.target.value))
            }
          />
        </Field>
        <Field label="Cause" required>
          <textarea
            className="input min-h-[90px]"
            value={form.cause}
            onChange={(e) => setValue(setForm, "cause", e.target.value)}
          />
        </Field>
        <Field label="Consequence" required>
          <textarea
            className="input min-h-[90px]"
            value={form.consequence}
            onChange={(e) => setValue(setForm, "consequence", e.target.value)}
          />
        </Field>
        <Field label="Existing safeguards">
          <textarea
            className="input min-h-[90px]"
            value={form.existingSafeguards}
            onChange={(e) =>
              setValue(setForm, "existingSafeguards", e.target.value)
            }
          />
        </Field>
        <Field label="Owner">
          <select
            className="input"
            value={form.ownerId}
            onChange={(e) => setValue(setForm, "ownerId", e.target.value)}
          >
            <option value="">Unassigned</option>
            {users.map((user: any) => (
              <option key={user.id} value={user.id}>
                {user.displayName ?? user.email}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Status">
          <select
            className="input"
            value={form.status}
            onChange={(e) => setValue(setForm, "status", e.target.value)}
          >
            {[
              "Draft",
              "Open",
              "In Review",
              "Recommendation Required",
              "Action Open",
              "LOPA Required",
              "Closed",
              "Rejected",
            ].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </Field>
        <Field label="Notes">
          <textarea
            className="input min-h-[80px]"
            value={form.notes}
            onChange={(e) => setValue(setForm, "notes", e.target.value)}
          />
        </Field>
      </div>
      <div className="mt-4 flex flex-wrap gap-4 rounded-lg border border-[var(--psm-line)] p-3 text-sm">
        <label>
          <input
            type="checkbox"
            checked={form.recommendationRequired}
            onChange={(e) =>
              setValue(setForm, "recommendationRequired", e.target.checked)
            }
          />{" "}
          Recommendation required
        </label>
        <label>
          <input
            type="checkbox"
            checked={form.lopaRequired}
            onChange={(e) =>
              setValue(setForm, "lopaRequired", e.target.checked)
            }
          />{" "}
          LOPA required
        </label>
      </div>
      {form.lopaRequired ? (
        <Field label="LOPA trigger reason">
          <input
            className="input mt-3"
            value={form.lopaTriggerReason}
            onChange={(e) =>
              setValue(setForm, "lopaTriggerReason", e.target.value)
            }
          />
        </Field>
      ) : null}
      {errors.length ? (
        <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
          {errors.join(" · ")}
        </div>
      ) : null}
      <div className="mt-5 flex justify-end gap-2">
        <ActionButton onClick={onClose}>Cancel</ActionButton>
        {state.mode !== "edit" ? (
          <ActionButton
            disabled={Boolean(errors.length) || saving}
            onClick={() => onSubmit(payload(), true)}
          >
            {saving ? "Saving..." : "Save and Add Another"}
          </ActionButton>
        ) : null}
        <ActionButton
          primary
          disabled={Boolean(errors.length) || saving}
          onClick={() => onSubmit(payload(), false)}
        >
          {saving ? "Saving..." : "Save Scenario"}
        </ActionButton>
      </div>
    </Modal>
  );
}

function normalizeScenarioPayload(values: Record<string, any>) {
  const next = { ...values };
  for (const key of [
    "deviationId",
    "guideword",
    "parameter",
    "deviation",
    "deviationText",
    "existingSafeguards",
    "lopaTriggerReason",
    "ownerId",
    "notes",
    "status",
  ]) {
    if (next[key] === null || next[key] === undefined || next[key] === "") {
      delete next[key];
    }
  }
  for (const key of ["residualSeverity", "residualLikelihood"]) {
    if (next[key] === "" || next[key] === null || next[key] === undefined) {
      delete next[key];
    } else {
      next[key] = Number(next[key]);
    }
  }
  next.severity = Number(next.severity);
  next.likelihood = Number(next.likelihood);
  return next;
}

function BulkGenerateDeviationsDialog({
  node,
  guidewords,
  parameters,
  onClose,
  onSubmit,
}: any) {
  const [selectedGuidewords, setGuidewords] = useState<string[]>(
    guidewords.slice(0, 4),
  );
  const [selectedParameters, setParameters] = useState<string[]>(
    parameters.slice(0, 6),
  );
  const [mode, setMode] = useState("common");
  return (
    <Modal
      title={`Bulk Generate Deviations - ${node.node_number}`}
      onClose={onClose}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Checklist
          title="Guidewords"
          options={guidewords}
          values={selectedGuidewords}
          onChange={setGuidewords}
        />
        <Checklist
          title="Parameters"
          options={parameters}
          values={selectedParameters}
          onChange={setParameters}
        />
      </div>
      <Field label="Generation mode">
        <select
          className="input mt-3"
          value={mode}
          onChange={(e) => setMode(e.target.value)}
        >
          <option value="common">Common HAZOP combinations only</option>
          <option value="all">All combinations</option>
          <option value="template">Site template</option>
        </select>
      </Field>
      <div className="mt-4 rounded-lg border border-[var(--psm-line)] p-3 text-sm text-[var(--psm-muted)]">
        Draft rows will be created only for missing guideword/parameter
        combinations. Causes and consequences remain to be filled by the study
        team.
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <ActionButton onClick={onClose}>Cancel</ActionButton>
        <ActionButton
          primary
          onClick={() =>
            onSubmit({
              guidewords: selectedGuidewords,
              parameters: selectedParameters,
              mode,
            })
          }
        >
          Generate Draft Rows
        </ActionButton>
      </div>
    </Modal>
  );
}

function MarkLopaRequiredDialog({ scenario, saving, onClose, onSubmit }: any) {
  const [form, setForm] = useState<Record<string, any>>({
    reason: scenario.lopa_trigger_reason ?? "",
    source: "High/Critical Risk",
    requiredBy: "",
    dueDate: "",
    notes: "",
    confirmed: false,
  });
  const set = (key: string, value: any) => setForm((current) => ({ ...current, [key]: value }));
  const errors = [
    !form.reason || form.reason.length < 5 ? "LOPA trigger reason is required." : null,
    !form.confirmed ? "Confirmation is required." : null,
  ].filter(Boolean);
  return (
    <Modal title="Mark LOPA Required" onClose={onClose}>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Scenario">
          <input className="input" value={`${scenario.scenario_number ?? scenario.id} · ${scenario.deviation_text ?? ""}`} disabled />
        </Field>
        <Field label="Trigger source">
          <select className="input" value={form.source} onChange={(event) => set("source", event.target.value)}>
            {["High/Critical Risk", "IPL Validation Failure", "Safeguard Gap", "Team Decision", "Regulatory Requirement", "MOC Requirement", "PSSR Requirement", "Other"].map((item) => <option key={item}>{item}</option>)}
          </select>
        </Field>
        <Field label="Required by">
          <input className="input" value={form.requiredBy} onChange={(event) => set("requiredBy", event.target.value)} placeholder="Role, person, or policy" />
        </Field>
        <Field label="Due date">
          <input type="date" className="input" value={form.dueDate} onChange={(event) => set("dueDate", event.target.value)} />
        </Field>
        <Field label="LOPA trigger reason" required>
          <textarea className="input min-h-28" value={form.reason} onChange={(event) => set("reason", event.target.value)} />
        </Field>
        <Field label="Notes">
          <textarea className="input min-h-28" value={form.notes} onChange={(event) => set("notes", event.target.value)} />
        </Field>
      </div>
      <label className="mt-4 flex items-start gap-3 rounded-lg border border-purple-400/25 bg-purple-500/10 p-3 text-sm text-purple-100">
        <input type="checkbox" checked={form.confirmed} onChange={(event) => set("confirmed", event.target.checked)} />
        I confirm this scenario requires LOPA review.
      </label>
      {errors.length ? <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">{errors.join(" ")}</div> : null}
      <div className="mt-5 flex justify-end gap-2">
        <ActionButton onClick={onClose}>Cancel</ActionButton>
        <ActionButton primary disabled={Boolean(errors.length) || saving} onClick={() => onSubmit(form)}>{saving ? "Saving..." : "Save LOPA Requirement"}</ActionButton>
      </div>
    </Modal>
  );
}

function Toast({ tone, text, onClose }: { tone: "success" | "error" | "info"; text: string; onClose: () => void }) {
  const tones = {
    success: "border-emerald-400/30 bg-emerald-500/15 text-emerald-100",
    error: "border-red-400/30 bg-red-500/15 text-red-100",
    info: "border-blue-400/30 bg-blue-500/15 text-blue-100",
  };
  return (
    <div className={`fixed right-5 top-5 z-[70] flex max-w-md items-center justify-between gap-4 rounded-xl border px-4 py-3 text-sm shadow-2xl ${tones[tone]}`}>
      <span>{text}</span>
      <button type="button" onClick={onClose} className="text-current opacity-70 hover:opacity-100"><X size={14} /></button>
    </div>
  );
}

function HazopScenarioDetailDrawer({
  study,
  scenario,
  node,
  users,
  canEdit,
  canRisk,
  canRecommend,
  onClose,
  onSave,
  onAddRecommendation,
  onMarkLopa,
  onCloseScenario,
}: any) {
  const [draft, setDraft] = useState<Record<string, any>>({
    ...scenario,
    existingSafeguards: scenario.existing_safeguards ?? "",
    deviationText: scenario.deviation_text ?? "",
    ownerId: scenario.owner_id ?? "",
    lopaTriggerReason: scenario.lopa_trigger_reason ?? "",
    notes: scenario.notes ?? "",
  });
  const recs = recommendationsFor(study, scenario.id);
  const history = (study.history ?? []).filter(
    (event: any) =>
      JSON.stringify(event.metadata ?? {}).includes(scenario.id) ||
      event.description?.includes(scenario.scenario_number),
  );
  return (
    <div className="fixed inset-0 z-50 bg-black/60">
      <aside className="ml-auto h-full w-full max-w-3xl overflow-y-auto border-l border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-[var(--psm-muted)]">
                {node?.node_number} · {node?.title}
              </span>
              <RiskBadge value={scenario.risk_level} />
              {scenario.lopa_required ? (
                <Badge tone="purple">LOPA Required</Badge>
              ) : null}
            </div>
            <h2 className="mt-2 text-2xl font-semibold">
              {scenario.scenario_number}
            </h2>
            <p className="mt-1 text-sm text-[var(--psm-muted)]">
              {scenario.deviation_text}
            </p>
          </div>
          <IconButton label="Close" onClick={onClose}>
            <X size={18} />
          </IconButton>
        </div>
        <div className="grid gap-4">
          <InfoCard
            title="Scenario Summary"
            icon={AlertTriangle}
            lines={[
              `Status: ${scenario.status}`,
              `Owner: ${scenario.owner_id ?? "Unassigned"}`,
              `Recommendation required: ${scenario.recommendation_required ? "Yes" : "No"}`,
            ]}
          />
          <div className="grid gap-3 lg:grid-cols-3">
            <Field label="Guideword">
              <input
                className="input"
                value={draft.guideword ?? ""}
                disabled={!canEdit}
                onChange={(e) =>
                  setValue(setDraft, "guideword", e.target.value)
                }
              />
            </Field>
            <Field label="Parameter">
              <input
                className="input"
                value={draft.parameter ?? ""}
                disabled={!canEdit}
                onChange={(e) =>
                  setValue(setDraft, "parameter", e.target.value)
                }
              />
            </Field>
            <Field label="Deviation">
              <input
                className="input"
                value={draft.deviationText ?? ""}
                disabled={!canEdit}
                onChange={(e) =>
                  setValue(setDraft, "deviationText", e.target.value)
                }
              />
            </Field>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            <Field label="Causes">
              <textarea
                className="input min-h-[120px]"
                value={draft.cause ?? ""}
                disabled={!canEdit}
                onChange={(e) => setValue(setDraft, "cause", e.target.value)}
              />
            </Field>
            <Field label="Consequences">
              <textarea
                className="input min-h-[120px]"
                value={draft.consequence ?? ""}
                disabled={!canEdit}
                onChange={(e) =>
                  setValue(setDraft, "consequence", e.target.value)
                }
              />
            </Field>
            <Field label="Safeguards">
              <textarea
                className="input min-h-[120px]"
                value={draft.existingSafeguards ?? ""}
                disabled={!canEdit}
                onChange={(e) =>
                  setValue(setDraft, "existingSafeguards", e.target.value)
                }
              />
            </Field>
            <Field label="Notes">
              <textarea
                className="input min-h-[120px]"
                value={draft.notes ?? ""}
                disabled={!canEdit}
                onChange={(e) => setValue(setDraft, "notes", e.target.value)}
              />
            </Field>
          </div>
          <div className="grid gap-3 lg:grid-cols-5">
            <MetricCard label="Severity" value={scenario.severity} />
            <MetricCard label="Likelihood" value={scenario.likelihood} />
            <MetricCard label="Score" value={scenario.risk_score} />
            <MetricCard
              label="Residual"
              value={scenario.residual_risk_level ?? "-"}
            />
            <MetricCard
              label="LOPA"
              value={scenario.lopa_required ? "Yes" : "No"}
            />
          </div>
          {canRisk ? (
            <div className="grid gap-3 lg:grid-cols-3">
              <Field label="New severity">
                <input
                  className="input"
                  type="number"
                  min={1}
                  max={5}
                  value={draft.severity ?? ""}
                  onChange={(e) =>
                    setValue(setDraft, "severity", Number(e.target.value))
                  }
                />
              </Field>
              <Field label="New likelihood">
                <input
                  className="input"
                  type="number"
                  min={1}
                  max={5}
                  value={draft.likelihood ?? ""}
                  onChange={(e) =>
                    setValue(setDraft, "likelihood", Number(e.target.value))
                  }
                />
              </Field>
              <Field label="Owner">
                <select
                  className="input"
                  value={draft.ownerId ?? ""}
                  onChange={(e) =>
                    setValue(setDraft, "ownerId", e.target.value)
                  }
                >
                  <option value="">Unassigned</option>
                  {users.map((u: any) => (
                    <option key={u.id} value={u.id}>
                      {u.displayName ?? u.email}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          ) : null}
          <InfoCard
            title="Recommendations"
            icon={CheckCircle2}
            lines={
              recs.length
                ? recs.map(
                    (rec: any) =>
                      `${rec.recommendation_number} - ${rec.title} (${rec.status})`,
                  )
                : ["No recommendations linked."]
            }
          />
          <InfoCard
            title="LOPA Trigger"
            icon={ShieldAlert}
            lines={[
              scenario.lopa_required
                ? (scenario.lopa_trigger_reason ??
                  "LOPA required by risk policy")
                : "Not currently required.",
            ]}
          />
          <InfoCard
            title="Linked Actions"
            icon={GitBranch}
            lines={recs
              .filter((rec: any) => rec.action_id)
              .map(
                (rec: any) => `${rec.recommendation_number}: ${rec.action_id}`,
              )}
          />
          <InfoCard
            title="Scenario History"
            icon={RotateCcw}
            lines={
              history.length
                ? history.map(
                    (event: any) =>
                      `${event.title} · ${new Date(event.created_at).toLocaleString()}`,
                  )
                : ["No scenario-specific history yet."]
            }
          />
        </div>
        <div className="sticky bottom-0 mt-5 flex flex-wrap justify-end gap-2 border-t border-[var(--psm-line)] bg-[var(--psm-surface)] py-4">
          {canRecommend ? (
            <ActionButton onClick={onAddRecommendation}>
              Add Recommendation
            </ActionButton>
          ) : null}
          {canRisk ? (
            <ActionButton onClick={onMarkLopa}>
              Mark LOPA Required
            </ActionButton>
          ) : null}
          {canEdit ? (
            <ActionButton onClick={onCloseScenario}>
              Mark Scenario Closed
            </ActionButton>
          ) : null}
          {canEdit ? (
            <ActionButton primary onClick={() => onSave(normalizeScenarioPayload(draft))}>
              Save
            </ActionButton>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

function enrichNodes(study: any) {
  const riskOrder: Record<string, number> = {
    Low: 1,
    Medium: 2,
    High: 3,
    Critical: 4,
  };
  return [...(study.nodes ?? [])]
    .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((node: any) => {
      const scenarios = (study.scenarios ?? []).filter(
        (scenario: any) => scenario.node_id === node.id,
      );
      const recs = (study.recommendations ?? []).filter((rec: any) =>
        scenarios.some((scenario: any) => scenario.id === rec.scenario_id),
      );
      const highest = scenarios.reduce(
        (best: string | null, scenario: any) =>
          !best ||
          (riskOrder[scenario.risk_level] ?? 0) > (riskOrder[best] ?? 0)
            ? scenario.risk_level
            : best,
        null,
      );
      const equipmentSnapshots = node.equipmentLinks?.length ? node.equipmentLinks : node.equipment_link_snapshots ?? [];
      const documentSnapshots = node.documentLinks?.length ? node.documentLinks : node.document_version_snapshots ?? [];
      return {
        ...node,
        scenarioCount: scenarios.length,
        equipmentCount: equipmentSnapshots.length || (node.equipment_ids ?? []).length,
        equipmentLabel: equipmentSnapshots.length
          ? equipmentSnapshots.slice(0, 2).map((item: any) => item.tag ?? item.equipmentTag ?? item.equipment_tag ?? item.name ?? item.equipmentName).filter(Boolean).join(", ")
          : (node.equipment_ids ?? []).slice(0, 2).join(", "),
        documentCount: documentSnapshots.length || [
          ...(node.document_ids ?? []),
          ...(node.pid_references ?? []),
        ].length,
        highRiskCount: scenarios.filter((s: any) =>
          ["High", "Critical"].includes(s.risk_level),
        ).length,
        openRecommendationCount: recs.filter(
          (r: any) => !["Closed", "Cancelled"].includes(r.status),
        ).length,
        lopaRequiredCount: scenarios.filter((s: any) => s.lopa_required).length,
        highestRisk: highest,
        completionPercent: scenarios.length
          ? Math.round((scenarios.filter((s: any) => ["Closed", "Completed", "Accepted"].includes(s.status)).length / scenarios.length) * 100)
          : ["Completed", "Closed"].includes(node.status) ? 100 : 0,
      };
    });
}

function recommendationsFor(study: any, scenarioId: string) {
  return (study.recommendations ?? []).filter(
    (rec: any) => rec.scenario_id === scenarioId,
  );
}

function labelsFromIds(
  rows: any[],
  ids: string[] = [],
  primary: string,
  secondary: string,
) {
  return ids
    .map((id) => rows.find((row) => row.id === id))
    .filter(Boolean)
    .map((row) => [row[primary], row[secondary]].filter(Boolean).join(" - "));
}

function autoDeviation(guideword?: string, parameter?: string) {
  if (!guideword || !parameter) return "";
  if (guideword === "More" && parameter === "Pressure")
    return "More Pressure / High Pressure";
  if (guideword === "Less" && parameter === "Pressure")
    return "Less Pressure / Low Pressure";
  if (guideword === "More" && parameter === "Temperature")
    return "More Temperature / High Temperature";
  if (guideword === "Less" && parameter === "Temperature")
    return "Less Temperature / Low Temperature";
  return `${guideword} ${parameter}`;
}

function setValue(setter: any, key: string, value: any) {
  setter((current: any) => ({ ...current, [key]: value }));
}

function title(value: string) {
  return value.replace(/(^|\s)\S/g, (match) => match.toUpperCase());
}

function Banner({ children, tone }: { children: any; tone: "red" | "amber" }) {
  return (
    <div
      className={cn(
        "rounded-xl border p-3 text-sm",
        tone === "red"
          ? "border-red-500/30 bg-red-500/10 text-red-200"
          : "border-amber-500/30 bg-amber-500/10 text-amber-200",
      )}
    >
      {children}
    </div>
  );
}

function Badge({ children, tone = "slate" }: { children: any; tone?: string }) {
  const tones: Record<string, string> = {
    slate: "border-slate-500/30 bg-slate-500/10 text-slate-200",
    blue: "border-blue-500/30 bg-blue-500/10 text-blue-200",
    green: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
    amber: "border-amber-500/30 bg-amber-500/10 text-amber-200",
    purple: "border-purple-500/30 bg-purple-500/10 text-purple-200",
  };
  return (
    <span
      className={cn(
        "inline-flex rounded-md border px-2 py-1 text-xs font-semibold",
        tones[tone] ?? tones.slate,
      )}
    >
      {children}
    </span>
  );
}

function MiniMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: string;
}) {
  return (
    <div className="rounded-md border border-[var(--psm-line)] p-2">
      <div className={cn("font-bold", tone)}>{value}</div>
      <div className="text-[var(--psm-muted)]">{label}</div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-lg border border-[var(--psm-line)] p-3">
      <div className="text-xs text-[var(--psm-muted)]">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}

function InfoCard({
  title,
  icon: Icon,
  lines,
}: {
  title: string;
  icon: any;
  lines: any[];
}) {
  const visible = lines.filter(Boolean);
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
      <div className="mb-3 flex items-center gap-2 font-semibold">
        <Icon size={16} /> {title}
      </div>
      {visible.length ? (
        visible.map((line, index) => (
          <p key={index} className="mb-2 text-sm text-[var(--psm-muted)]">
            {line}
          </p>
        ))
      ) : (
        <p className="text-sm text-[var(--psm-muted)]">No data captured.</p>
      )}
    </section>
  );
}

function EmptyState({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: any;
}) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--psm-line)] p-6 text-center">
      <div className="font-semibold">{title}</div>
      <p className="mt-1 text-sm text-[var(--psm-muted)]">{text}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

function Field({
  label,
  children,
  required,
}: {
  label: string;
  children: any;
  required?: boolean;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--psm-muted)]">
        {label}
        {required ? <span className="text-red-300"> *</span> : null}
      </span>
      {children}
    </label>
  );
}

function MultiSelect({
  values,
  options,
  onChange,
}: {
  values: string[];
  options: Array<{ value: string; label: string }>;
  onChange: (values: string[]) => void;
}) {
  return (
    <select
      multiple
      className="input min-h-[120px]"
      value={values ?? []}
      onChange={(event) =>
        onChange(
          Array.from(event.target.selectedOptions).map(
            (option) => option.value,
          ),
        )
      }
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function Checklist({
  title,
  options,
  values,
  onChange,
}: {
  title: string;
  options: string[];
  values: string[];
  onChange: (values: string[]) => void;
}) {
  return (
    <div className="rounded-xl border border-[var(--psm-line)] p-3">
      <div className="mb-2 font-semibold">{title}</div>
      <div className="grid max-h-64 gap-2 overflow-y-auto sm:grid-cols-2">
        {options.map((option) => (
          <label
            key={option}
            className="rounded-lg border border-[var(--psm-line)] p-2 text-sm"
          >
            <input
              type="checkbox"
              className="mr-2"
              checked={values.includes(option)}
              onChange={(event) =>
                onChange(
                  event.target.checked
                    ? [...values, option]
                    : values.filter((value) => value !== option),
                )
              }
            />
            {option}
          </label>
        ))}
      </div>
    </div>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: any;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <section className="max-h-[88vh] w-full max-w-5xl overflow-y-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] shadow-2xl">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <IconButton label="Close" onClick={onClose}>
            <X size={18} />
          </IconButton>
        </header>
        <div className="p-4">{children}</div>
      </section>
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  primary,
  disabled,
}: {
  children: any;
  onClick: () => void;
  primary?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50",
        primary
          ? "border-primary bg-primary text-white hover:bg-primary/90"
          : "border-[var(--psm-line)] hover:bg-[var(--psm-surface-2)]",
      )}
    >
      {children}
    </button>
  );
}

function IconButton({
  children,
  label,
  onClick,
}: {
  children: any;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      title={label}
      aria-label={label}
      onClick={onClick}
      className="rounded-lg border border-[var(--psm-line)] p-2 hover:bg-[var(--psm-surface-2)]"
    >
      {children}
    </button>
  );
}

function TinyButton({
  children,
  label,
  onClick,
  disabled,
}: {
  children: any;
  label: string;
  onClick: (event?: any) => void;
  disabled?: boolean;
}) {
  return (
    <button
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="rounded-md border border-[var(--psm-line)] p-1.5 text-[var(--psm-muted)] hover:bg-[var(--psm-surface-2)] disabled:opacity-40"
    >
      {children}
    </button>
  );
}
