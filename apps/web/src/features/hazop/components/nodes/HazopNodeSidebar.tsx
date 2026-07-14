"use client";

import { useState } from "react";
import { Filter, Plus, Search } from "lucide-react";
import { HazopNodeSidebarItem } from "./HazopNodeSidebarItem";

export function HazopNodeSidebar({ nodes, activeNodeId, onSelect, onAdd, onDuplicate, onDelete, onMove, canEdit, canCreate, canDelete }: any) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [riskFilter, setRiskFilter] = useState("All");
  const filteredNodes = nodes.filter((node: any) => {
    const text = [node.node_number, node.title, node.design_intent, node.process_section, ...(node.equipment_ids ?? [])].filter(Boolean).join(" ").toLowerCase();
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
            <button className="rounded-md border border-white/10 p-1.5 text-slate-400 hover:text-slate-100" title="Filter nodes"><Filter size={13} /></button>
            {canCreate ? <button className="rounded-md border border-white/10 p-1.5 text-slate-400 hover:text-slate-100" title="Add node" onClick={onAdd}><Plus size={13} /></button> : null}
          </div>
        </div>
        <div className="relative">
          <Search size={13} className="pointer-events-none absolute left-2 top-2.5 text-slate-500" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} className="h-8 w-full rounded-md border border-white/10 bg-black/20 pl-7 pr-2 text-xs text-slate-100 outline-none placeholder:text-slate-500 focus:border-primary/60" placeholder="Search nodes..." />
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
          <HazopNodeSidebarItem key={node.id} node={node} index={index} total={filteredNodes.length} active={activeNodeId === node.id} canEdit={canEdit} canCreate={canCreate} canDelete={canDelete} onSelect={onSelect} onDuplicate={onDuplicate} onDelete={onDelete} onMove={onMove} />
        ))}
        {!filteredNodes.length ? <div className="rounded-lg border border-dashed border-white/10 p-5 text-center text-xs text-slate-500">No nodes match the current filters.</div> : null}
      </div>
      {canCreate ? <div className="border-t border-white/10 p-2"><button onClick={onAdd} className="flex h-10 w-full items-center justify-center gap-2 rounded-md border border-white/10 bg-white/[.03] text-xs font-semibold text-slate-200 transition hover:border-primary/50 hover:bg-primary/10"><Plus size={13} /> Add New Node</button></div> : null}
    </aside>
  );
}
