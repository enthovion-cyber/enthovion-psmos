"use client";

import { Filter, Search } from "lucide-react";

export function HazopNodeSearchFilter({
  search,
  statusFilter,
  riskFilter,
  onSearch,
  onStatusFilter,
  onRiskFilter,
}: {
  search: string;
  statusFilter: string;
  riskFilter: string;
  onSearch: (value: string) => void;
  onStatusFilter: (value: string) => void;
  onRiskFilter: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="relative block">
        <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          className="h-8 w-full rounded-md border border-white/10 bg-black/20 pl-8 pr-2 text-xs text-slate-200 outline-none placeholder:text-slate-500 focus:border-primary/50"
          placeholder="Search nodes..."
          value={search}
          onChange={(event) => onSearch(event.target.value)}
        />
      </label>
      <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
        <select className="h-8 rounded-md border border-white/10 bg-black/20 px-2 text-xs text-slate-300" value={statusFilter} onChange={(event) => onStatusFilter(event.target.value)}>
          {["All", "Draft", "In Progress", "Reviewed", "Completed", "Needs Rework", "Closed"].map((status) => <option key={status}>{status}</option>)}
        </select>
        <select className="h-8 rounded-md border border-white/10 bg-black/20 px-2 text-xs text-slate-300" value={riskFilter} onChange={(event) => onRiskFilter(event.target.value)}>
          {["All", "Critical", "High", "Medium", "Low"].map((risk) => <option key={risk}>{risk}</option>)}
        </select>
        <button className="grid h-8 w-8 place-items-center rounded-md border border-white/10 text-slate-400" title="Node filters">
          <Filter size={13} />
        </button>
      </div>
    </div>
  );
}
