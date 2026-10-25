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
    <aside className="sticky top-4 flex max-h-[calc(100vh-140px)] min-h-[560px] flex-col overflow-hidden rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] shadow-md">
      <div className="border-b border-[var(--psm-line)] p-3 bg-[var(--psm-surface)]">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[var(--psm-text)]">Nodes ({nodes.length})</h3>
            <p className="text-[11px] text-[var(--psm-muted)]">Study worksheet sections</p>
          </div>
          {canCreate ? <button type="button" onClick={onAdd} className="grid h-8 w-8 place-items-center rounded-md bg-emerald-600 dark:bg-emerald-500 text-white transition hover:opacity-90" title="Add node"><Plus size={14} /></button> : null}
        </div>
        <HazopNodeSearchFilter search={search} statusFilter={statusFilter} riskFilter={riskFilter} onSearch={setSearch} onStatusFilter={setStatusFilter} onRiskFilter={setRiskFilter} />
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-2">
        {loading ? <State text="Loading nodes..." /> : null}
        {error ? <State text="Unable to load node context." tone="text-rose-500" /> : null}
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
        <div className="border-t border-[var(--psm-line)] p-2.5 bg-[var(--psm-surface)]">
          <button type="button" onClick={onAdd} className="inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-xs font-semibold text-[var(--psm-text)] hover:border-emerald-500/40 hover:bg-emerald-500/10 transition">
            <Plus size={13} /> Add New Node
          </button>
        </div>
      ) : null}
    </aside>
  );
}

function State({ text, tone = "text-[var(--psm-muted)]" }: { text: string; tone?: string }) {
  return <div className={`rounded-lg border border-dashed border-[var(--psm-line)] p-4 text-center text-xs ${tone}`}>{text}</div>;
}
