"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/utils/cn";
import type { HazopNodeEquipmentLink } from "../../types/hazop-node.types";

export function HazopEquipmentMultiSelect({
  equipment,
  selected,
  onChange,
  canOpenRegistry,
}: {
  equipment: HazopNodeEquipmentLink[];
  selected: HazopNodeEquipmentLink[];
  onChange: (items: HazopNodeEquipmentLink[]) => void;
  canOpenRegistry?: boolean;
}) {
  const [query, setQuery] = useState("");
  const selectedIds = new Set(selected.map((item) => item.id));
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return equipment.filter((item) => {
      if (!term) return true;
      return [item.tag, item.equipmentTag, item.name, item.equipmentName, item.type, item.equipmentType, item.status, item.criticality]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [equipment, query]);

  const toggle = (item: HazopNodeEquipmentLink) => {
    if (selectedIds.has(item.id)) onChange(selected.filter((selectedItem) => selectedItem.id !== item.id));
    else onChange([...selected, item]);
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search size={14} className="pointer-events-none absolute left-3 top-3 text-slate-500" />
        <input
          className="input pl-9"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search equipment tag, name, type, unit, area..."
        />
      </div>
      <div className="max-h-64 overflow-y-auto rounded-lg border border-white/10 bg-black/10">
        {filtered.map((item) => {
          const checked = selectedIds.has(item.id);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => toggle(item)}
              className={cn("grid w-full grid-cols-[auto_1fr_auto] gap-3 border-b border-white/5 p-3 text-left last:border-b-0 hover:bg-white/[.04]", checked && "bg-primary/10")}
            >
              <span className={cn("mt-1 h-4 w-4 rounded border", checked ? "border-primary bg-primary" : "border-white/20")} />
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-slate-100">{item.tag ?? item.equipmentTag ?? "No tag"} · {item.name ?? item.equipmentName ?? "Unnamed"}</span>
                <span className="mt-1 block text-xs text-slate-400">{item.type ?? item.equipmentType ?? "Equipment"} · {item.criticality ?? "No criticality"}</span>
              </span>
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 text-[10px] font-semibold text-emerald-200">{item.status ?? "Active"}</span>
            </button>
          );
        })}
        {!filtered.length ? (
          <div className="p-5 text-sm text-slate-400">
            No registered equipment found for this area. Link equipment later or update Equipment Registry.
          </div>
        ) : null}
      </div>
      <div className="flex flex-wrap justify-between gap-2 text-xs">
        <span className="text-slate-500">{selected.length} equipment item(s) selected</span>
        {canOpenRegistry ? <a className="text-primary hover:underline" href="/equipment">Open Equipment Registry</a> : <span className="text-slate-600">Equipment Registry access restricted</span>}
      </div>
    </div>
  );
}
