"use client";

import { AlertTriangle, CheckCircle2, Layers3, Link2, Save, X } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/utils/cn";
import { HazopNodeCoreIdentityTab } from "./HazopNodeCoreIdentityTab";
import { HazopNodeHierarchyTab } from "./HazopNodeHierarchyTab";
import { HazopNodeParametersTab } from "./HazopNodeParametersTab";
import { HazopNodeRegistryIntegrationTab } from "./HazopNodeRegistryIntegrationTab";
import type { HazopNodeDocumentLink, HazopNodeEquipmentLink, HazopNodeParameterConfiguration } from "../../types/hazop-node.types";

type NodeDialogState = { mode: "create" | "edit"; node?: any };

const tabs = [
  { id: "hierarchy", label: "Site Hierarchy", icon: Layers3 },
  { id: "identity", label: "Core Identity", icon: CheckCircle2 },
  { id: "registry", label: "Registry Integration", icon: Link2 },
  { id: "parameters", label: "Study Parameters", icon: AlertTriangle },
] as const;

export function AddEditHazopNodeDialog({
  state,
  context,
  saving,
  canOverrideHierarchy,
  canCreateCustomParameter,
  canOpenRegistry,
  canOpenDocuments,
  onClose,
  onSubmit,
  onCreateCustomParameter,
}: {
  state: NodeDialogState;
  context: any;
  saving?: boolean;
  canOverrideHierarchy?: boolean;
  canCreateCustomParameter?: boolean;
  canOpenRegistry?: boolean;
  canOpenDocuments?: boolean;
  onClose: () => void;
  onSubmit: (values: Record<string, any>, addAnother: boolean) => void;
  onCreateCustomParameter?: (values: { name: string; category?: string; unitHint?: string }) => void;
}) {
  const source = state.node ?? {};
  const hierarchy = context?.hierarchy ?? {};
  const equipmentOptions = context?.equipment ?? [];
  const documentOptions = context?.documents ?? [];
  const initialEquipment = normalizeSelectedEquipment(source, equipmentOptions);
  const initialDocuments = normalizeSelectedDocuments(source, documentOptions);
  const initialParameters = normalizeParameters(source);
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["id"]>("hierarchy");
  const [selectedEquipment, setSelectedEquipment] = useState<HazopNodeEquipmentLink[]>(initialEquipment);
  const [selectedDocuments, setSelectedDocuments] = useState<HazopNodeDocumentLink[]>(initialDocuments);
  const [selectedParameters, setSelectedParameters] = useState<string[]>(initialParameters.map((row) => row.parameterName));
  const [parameterRows, setParameterRows] = useState<HazopNodeParameterConfiguration[]>(initialParameters);
  const [form, setForm] = useState<Record<string, any>>({
    nodeNumber: source.node_number ?? source.nodeNumber ?? context?.nextNodeNumber ?? "",
    title: source.title ?? "",
    description: source.description ?? "",
    designIntent: source.design_intent ?? "",
    ownerId: source.owner_id ?? "",
    status: source.status ?? "Draft",
    siteId: source.site_id ?? context?.study?.site_id ?? hierarchy?.site?.id ?? "",
    complexId: source.complex_id ?? context?.study?.complex_id ?? hierarchy?.complex?.id ?? "",
    unitId: source.unit_id ?? context?.study?.unit_id ?? hierarchy?.unit?.id ?? "",
    areaId: source.area_id ?? context?.study?.area_id ?? hierarchy?.area?.id ?? "",
    boundaryLimits: source.boundary_limits ?? source.boundaries ?? "",
    assumptions: source.assumptions ?? "",
    exclusions: source.exclusions ?? "",
    normalOperatingConditions: source.normal_operating_conditions ?? "",
    processConditions: source.process_conditions ?? "",
    processConditionsJson: source.process_conditions_json ?? {},
  });

  const errors = useMemo(() => ({
    nodeNumber: form.nodeNumber?.trim() ? "" : "Node number is required",
    title: form.title?.trim() ? "" : "Node title is required",
    designIntent: form.designIntent?.trim() ? "" : "Design intent is required",
    boundaryLimits: form.boundaryLimits?.trim() ? "" : "Boundary / battery limits are required",
  }), [form]);
  const errorList = Object.values(errors).filter(Boolean);

  const update = (key: string, value: any) => setForm((current) => ({ ...current, [key]: value }));
  const payload = () => ({
    ...form,
    boundaries: form.boundaryLimits,
    equipmentIds: selectedEquipment.map((item) => item.id),
    documentIds: selectedDocuments.map((item) => item.id),
    pidReferences: selectedDocuments.map((item) => item.id),
    equipmentLinks: selectedEquipment,
    documentLinks: selectedDocuments.map((item) => ({
      ...item,
      pinnedVersion: item.revision ?? item.version ?? "current",
    })),
    selectedParameters,
    parameterConfigurations: parameterRows,
  });

  const activeIndex = tabs.findIndex((tab) => tab.id === activeTab);
  const goNext = () => setActiveTab(tabs[Math.min(tabs.length - 1, activeIndex + 1)]?.id ?? "parameters");
  const goBack = () => setActiveTab(tabs[Math.max(0, activeIndex - 1)]?.id ?? "hierarchy");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#071827] shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-white/10 p-5">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-primary">{state.mode === "edit" ? "Edit HAZOP Node" : "Add HAZOP Node"}</div>
            <h2 className="mt-1 text-xl font-semibold text-slate-100">{state.mode === "edit" ? source.title : "Create process node"}</h2>
            <p className="mt-1 text-sm text-slate-400">Site context, registry links, and process envelope are saved to the live HAZOP node record.</p>
          </div>
          <button type="button" className="rounded-lg border border-white/10 p-2 text-slate-400 hover:bg-white/10 hover:text-slate-100" onClick={onClose}>
            <X size={18} />
          </button>
        </header>
        <nav className="flex gap-2 overflow-x-auto border-b border-white/10 px-5 py-3">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={cn("flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition", activeTab === tab.id ? "border-primary/60 bg-primary/15 text-primary" : "border-white/10 bg-white/[.02] text-slate-400 hover:text-slate-100")}>
                <Icon size={14} /> {tab.label}
              </button>
            );
          })}
        </nav>
        <main className="flex-1 overflow-y-auto p-5">
          {activeTab === "hierarchy" ? <HazopNodeHierarchyTab form={form} hierarchy={hierarchy} owners={context?.users ?? []} canOverride={canOverrideHierarchy} onChange={update} /> : null}
          {activeTab === "identity" ? <HazopNodeCoreIdentityTab form={form} errors={errors} onChange={update} /> : null}
          {activeTab === "registry" ? (
            <HazopNodeRegistryIntegrationTab
              equipment={equipmentOptions}
              documents={documentOptions}
              selectedEquipment={selectedEquipment}
              selectedDocuments={selectedDocuments}
              canOpenRegistry={Boolean(canOpenRegistry)}
              canOpenDocuments={Boolean(canOpenDocuments)}
              onEquipmentChange={setSelectedEquipment}
              onDocumentsChange={setSelectedDocuments}
            />
          ) : null}
          {activeTab === "parameters" ? (
            <HazopNodeParametersTab
              masterParameters={context?.masterParameters ?? context?.parameters ?? []}
              selectedParameters={selectedParameters}
              parameterRows={parameterRows}
              equipment={selectedEquipment}
              documents={selectedDocuments}
              canCreateCustom={Boolean(canCreateCustomParameter)}
              onSelectedParametersChange={setSelectedParameters}
              onParameterRowsChange={setParameterRows}
              onAddCustom={(value) => {
                onCreateCustomParameter?.(value);
                setParameterRows((rows) => rows.some((row) => row.parameterName === value.name) ? rows : [...rows, { parameterName: value.name, category: value.category ?? "Custom", isCustom: true }]);
              }}
            />
          ) : null}
          {errorList.length ? (
            <div className="mt-5 rounded-lg border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-100">
              <div className="font-semibold">Missing required fields</div>
              <div className="mt-1">{errorList.join(" · ")}</div>
            </div>
          ) : null}
        </main>
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-black/20 p-4">
          <div className="text-xs text-slate-500">
            {selectedEquipment.length} equipment · {selectedDocuments.length} documents · {selectedParameters.length} parameters
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-secondary" onClick={goBack} disabled={activeIndex === 0}>Back</button>
            {activeIndex < tabs.length - 1 ? <button type="button" className="btn-secondary" onClick={goNext}>Next</button> : null}
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            {state.mode === "create" ? (
              <button type="button" className="btn-secondary" disabled={Boolean(errorList.length) || saving} onClick={() => onSubmit(payload(), true)}>Save and Add Another</button>
            ) : null}
            <button type="button" className="btn-primary" disabled={Boolean(errorList.length) || saving} onClick={() => onSubmit(payload(), false)}>
              <Save size={14} /> {saving ? "Saving..." : "Save Node"}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

function normalizeSelectedEquipment(source: any, options: HazopNodeEquipmentLink[]) {
  if (Array.isArray(source.equipmentLinks) && source.equipmentLinks.length) return source.equipmentLinks;
  const ids = new Set(source.equipment_ids ?? []);
  return options.filter((item) => ids.has(item.id));
}

function normalizeSelectedDocuments(source: any, options: HazopNodeDocumentLink[]) {
  if (Array.isArray(source.documentLinks) && source.documentLinks.length) return source.documentLinks;
  const ids = new Set([...(source.document_ids ?? []), ...(source.pid_references ?? [])]);
  return options.filter((item) => ids.has(item.id));
}

function normalizeParameters(source: any): HazopNodeParameterConfiguration[] {
  const direct = source.parameterRows ?? source.parameter_configurations;
  if (Array.isArray(direct) && direct.length) {
    return direct.map((item: any) => ({
      parameterName: item.parameterName ?? item.parameter_name ?? item.name,
      category: item.category ?? item.parameter_category,
      normalOperatingRange: item.normalOperatingRange ?? item.normal_operating_range,
      designRange: item.designRange ?? item.design_range,
      unitOfMeasurement: item.unitOfMeasurement ?? item.unit_of_measurement,
      highLimit: item.highLimit ?? item.high_limit,
      lowLimit: item.lowLimit ?? item.low_limit,
      relatedEquipmentId: item.relatedEquipmentId ?? item.related_equipment_id,
      relatedDocumentId: item.relatedDocumentId ?? item.related_document_id,
      safetyConcern: item.safetyConcern ?? item.safety_concern,
      notes: item.notes,
      isCustom: item.isCustom ?? item.is_custom,
    })).filter((item: HazopNodeParameterConfiguration) => item.parameterName);
  }
  return (source.selected_parameters ?? []).map((name: string) => ({ parameterName: name }));
}
