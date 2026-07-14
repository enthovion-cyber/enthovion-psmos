"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import type { HazopNodeListItem } from "../../types/hazop-node.types";
import { HazopNodeSearchFilter } from "./HazopNodeSearchFilter";
import { HazopNodeSidebarItem } from "./HazopNodeSidebarItem";

export function HazopNodeSidebar({
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
  loading,
  error,
}: {
  nodes: HazopNodeListItem[];
  activeNodeId?: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onDuplicate: (node: HazopNodeListItem) => void;
  onDelete: (node: HazopNodeListItem) => void;
  onMove: (node: HazopNodeListItem, direction: "up" | "down") => void;
  canEdit: boolean;
  canCreate: boolean;
  canDelete: boolean;
  loading?: boolean;
  error?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [riskFilter, setRiskFilter] = useState("All");
  const filteredNodes = useMemo(() => nodes.filter((node) => {
    const text = [node.node_number, node.title, node.design_intent, node.process_section, node.equipmentLabel, ...(node.equipment_ids ?? [])].filter(Boolean).join(" ").toLowerCase();
    if (search && !text.includes(search.toLowerCase())) return false;
    if (statusFilter !== "All" && node.status !== statusFilter) return false;
    if (riskFilter !== "All" && node.highestRisk !== riskFilter) return false;
    return true;
  }), [nodes, riskFilter, search, statusFilter]);

  return (
    <aside className="sticky top-4 flex max-h-[calc(100vh-140px)] min-h-[620px] flex-col overflow-hidden rounded-xl border border-[var(--psm-line)] bg-[#061827] shadow-2xl shadow-black/20">
      <div className="border-b border-white/10 p-3">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Nodes ({nodes.length})</h3>
            <p className="text-[11px] text-slate-500">Study worksheet sections</p>
          </div>
          {canCreate ? <button type="button" onClick={onAdd} className="grid h-8 w-8 place-items-center rounded-md bg-emerald-500 text-white" title="Add node"><Plus size={14} /></button> : null}
        </div>
        <HazopNodeSearchFilter search={search} statusFilter={statusFilter} riskFilter={riskFilter} onSearch={setSearch} onStatusFilter={setStatusFilter} onRiskFilter={setRiskFilter} />
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-2">
        {loading ? <State text="Loading nodes..." /> : null}
        {error ? <State text="Unable to load node context." tone="text-red-300" /> : null}
        {!loading && !filteredNodes.length ? <State text="No nodes match the current filters." /> : null}
        {filteredNodes.map((node) => (
          <HazopNodeSidebarItem
            key={node.id}
            node={node}
            active={node.id === activeNodeId}
            canEdit={canEdit}
            canDelete={canDelete}
            onSelect={() => onSelect(node.id)}
            onDuplicate={() => onDuplicate(node)}
            onDelete={() => onDelete(node)}
            onMove={(direction) => onMove(node, direction)}
          />
        ))}
      </div>
      {canCreate ? (
        <div className="border-t border-white/10 p-3">
          <button type="button" onClick={onAdd} className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border border-white/10 bg-white/[0.03] text-xs font-semibold text-slate-200 hover:border-emerald-400/40 hover:bg-emerald-500/10">
            <Plus size={13} /> Add New Node
          </button>
        </div>
      ) : null}
    </aside>
  );
}

function State({ text, tone = "text-slate-500" }: { text: string; tone?: string }) {
  return <div className={`rounded-lg border border-dashed border-white/10 p-4 text-center text-xs ${tone}`}>{text}</div>;
}
