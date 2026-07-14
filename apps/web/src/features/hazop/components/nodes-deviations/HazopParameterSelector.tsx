"use client";

import { Plus, Sparkles, X } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/utils/cn";
import type { HazopNodeEquipmentLink } from "../../types/hazop-node.types";

const suggestionMap: Record<string, string[]> = {
  vessel: ["Level", "Pressure", "Temperature"],
  tank: ["Level", "Pressure", "Temperature"],
  pump: ["Flow", "Pressure", "Power"],
  exchanger: ["Temperature", "Flow", "Pressure", "Cooling", "Heating"],
  reactor: ["Temperature", "Pressure", "Reaction", "Mixing / Agitation", "Composition"],
  compressor: ["Pressure", "Flow", "Temperature", "Power"],
};

export function HazopParameterSelector({
  masterParameters,
  selected,
  equipment,
  canCreateCustom,
  onChange,
  onAddCustom,
}: {
  masterParameters: Array<{ id?: string; name: string; category?: string; unit_hint?: string }>;
  selected: string[];
  equipment: HazopNodeEquipmentLink[];
  canCreateCustom?: boolean;
  onChange: (values: string[]) => void;
  onAddCustom: (value: { name: string; category?: string; unitHint?: string }) => void;
}) {
  const [customName, setCustomName] = useState("");
  const suggestions = useMemo(() => {
    const names = new Set<string>();
    for (const item of equipment) {
      const type = String(item.type ?? item.equipmentType ?? "").toLowerCase();
      for (const [key, values] of Object.entries(suggestionMap)) {
        if (type.includes(key)) values.forEach((value) => names.add(value));
      }
    }
    return Array.from(names).filter((name) => !selected.includes(name));
  }, [equipment, selected]);

  const toggle = (name: string) => {
    if (selected.includes(name)) onChange(selected.filter((item) => item !== name));
    else onChange([...selected, name]);
  };

  return (
    <div className="space-y-4">
      {suggestions.length ? (
        <div className="rounded-lg border border-sky-400/20 bg-sky-400/10 p-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-sky-200"><Sparkles size={14} /> Smart suggestions from selected equipment</div>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((name) => (
              <button key={name} type="button" onClick={() => toggle(name)} className="rounded-full border border-sky-300/30 bg-sky-300/10 px-3 py-1 text-xs text-sky-100 hover:bg-sky-300/20">
                Accept {name}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {masterParameters.map((parameter) => {
          const active = selected.includes(parameter.name);
          return (
            <button key={parameter.id ?? parameter.name} type="button" onClick={() => toggle(parameter.name)} className={cn("rounded-full border px-3 py-1.5 text-xs font-semibold transition", active ? "border-primary bg-primary/20 text-primary" : "border-white/10 bg-white/[.03] text-slate-300 hover:border-primary/40")}>
              {active ? <X size={12} className="mr-1 inline" /> : null}{parameter.name}
            </button>
          );
        })}
      </div>
      <div className="rounded-lg border border-white/10 bg-black/10 p-3">
        <div className="mb-2 text-xs font-semibold uppercase text-slate-400">Custom parameter</div>
        <div className="flex gap-2">
          <input className="input" value={customName} onChange={(event) => setCustomName(event.target.value)} placeholder="Add site/study scoped custom parameter" disabled={!canCreateCustom} />
          <button
            type="button"
            className="btn-secondary whitespace-nowrap"
            disabled={!canCreateCustom || !customName.trim()}
            onClick={() => {
              const name = customName.trim();
              onAddCustom({ name, category: "Custom" });
              onChange(selected.includes(name) ? selected : [...selected, name]);
              setCustomName("");
            }}
          >
            <Plus size={14} /> Add
          </button>
        </div>
        {!canCreateCustom ? <p className="mt-2 text-xs text-slate-500">Custom parameters require process safety administrator permission.</p> : null}
      </div>
    </div>
  );
}
