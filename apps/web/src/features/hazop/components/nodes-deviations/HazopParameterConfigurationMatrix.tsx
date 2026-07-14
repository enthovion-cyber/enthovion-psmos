"use client";

import { Trash2 } from "lucide-react";
import type { HazopNodeDocumentLink, HazopNodeEquipmentLink, HazopNodeParameterConfiguration } from "../../types/hazop-node.types";

export function HazopParameterConfigurationMatrix({
  rows,
  equipment,
  documents,
  onChange,
}: {
  rows: HazopNodeParameterConfiguration[];
  equipment: HazopNodeEquipmentLink[];
  documents: HazopNodeDocumentLink[];
  onChange: (rows: HazopNodeParameterConfiguration[]) => void;
}) {
  const update = (index: number, key: keyof HazopNodeParameterConfiguration, value: string) => {
    onChange(rows.map((row, rowIndex) => rowIndex === index ? { ...row, [key]: value } : row));
  };
  const remove = (index: number) => onChange(rows.filter((_, rowIndex) => rowIndex !== index));

  return (
    <div className="overflow-x-auto rounded-lg border border-white/10">
      <table className="min-w-[1200px] w-full text-left text-xs">
        <thead className="bg-[#081827] text-slate-400">
          <tr>
            {["Parameter", "Type", "Normal range", "Design range", "UOM", "High", "Low", "Equipment", "P&ID / Document", "Safety concern", "Notes", ""].map((header) => (
              <th key={header} className="px-3 py-2">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row.parameterName}-${index}`} className="border-t border-white/5">
              <td className="px-3 py-2 font-semibold text-slate-100">{row.parameterName}</td>
              <td className="px-3 py-2"><input className="input h-8" value={row.category ?? ""} onChange={(event) => update(index, "category", event.target.value)} /></td>
              <td className="px-3 py-2"><input className="input h-8" value={row.normalOperatingRange ?? ""} onChange={(event) => update(index, "normalOperatingRange", event.target.value)} /></td>
              <td className="px-3 py-2"><input className="input h-8" value={row.designRange ?? ""} onChange={(event) => update(index, "designRange", event.target.value)} /></td>
              <td className="px-3 py-2"><input className="input h-8" value={row.unitOfMeasurement ?? ""} onChange={(event) => update(index, "unitOfMeasurement", event.target.value)} /></td>
              <td className="px-3 py-2"><input className="input h-8" value={row.highLimit ?? ""} onChange={(event) => update(index, "highLimit", event.target.value)} /></td>
              <td className="px-3 py-2"><input className="input h-8" value={row.lowLimit ?? ""} onChange={(event) => update(index, "lowLimit", event.target.value)} /></td>
              <td className="px-3 py-2">
                <select className="input h-8" value={row.relatedEquipmentId ?? ""} onChange={(event) => update(index, "relatedEquipmentId", event.target.value)}>
                  <option value="">None</option>
                  {equipment.map((item) => <option key={item.id} value={item.id}>{item.tag ?? item.equipmentTag ?? item.name}</option>)}
                </select>
              </td>
              <td className="px-3 py-2">
                <select className="input h-8" value={row.relatedDocumentId ?? ""} onChange={(event) => update(index, "relatedDocumentId", event.target.value)}>
                  <option value="">None</option>
                  {documents.map((item) => <option key={item.id} value={item.id}>{item.document_number ?? item.documentNumber ?? item.title}</option>)}
                </select>
              </td>
              <td className="px-3 py-2"><input className="input h-8" value={row.safetyConcern ?? ""} onChange={(event) => update(index, "safetyConcern", event.target.value)} /></td>
              <td className="px-3 py-2"><input className="input h-8" value={row.notes ?? ""} onChange={(event) => update(index, "notes", event.target.value)} /></td>
              <td className="px-3 py-2">
                <button type="button" className="rounded border border-red-400/20 p-1 text-red-300 hover:bg-red-400/10" onClick={() => remove(index)} title="Remove parameter">
                  <Trash2 size={13} />
                </button>
              </td>
            </tr>
          ))}
          {!rows.length ? (
            <tr><td colSpan={12} className="px-3 py-5 text-center text-slate-500">Select parameters to build the configuration matrix.</td></tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
