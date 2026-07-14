"use client";

import { FileText, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/utils/cn";
import type { HazopNodeDocumentLink } from "../../types/hazop-node.types";

export function HazopDocumentMultiSelect({
  documents,
  selected,
  onChange,
  canOpenDocuments,
}: {
  documents: HazopNodeDocumentLink[];
  selected: HazopNodeDocumentLink[];
  onChange: (items: HazopNodeDocumentLink[]) => void;
  canOpenDocuments?: boolean;
}) {
  const [query, setQuery] = useState("");
  const selectedIds = new Set(selected.map((item) => item.id));
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return documents.filter((item) => {
      if (!term) return true;
      return [item.document_number, item.documentNumber, item.title, item.document_type, item.documentType, item.revision, item.version, item.status]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [documents, query]);

  const toggle = (item: HazopNodeDocumentLink) => {
    if (selectedIds.has(item.id)) onChange(selected.filter((selectedItem) => selectedItem.id !== item.id));
    else onChange([...selected, item]);
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search size={14} className="pointer-events-none absolute left-3 top-3 text-slate-500" />
        <input className="input pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search P&ID, drawing, SOP, document number..." />
      </div>
      <div className="max-h-72 overflow-auto rounded-lg border border-white/10">
        <table className="min-w-full text-left text-xs">
          <thead className="sticky top-0 bg-[#081827] text-slate-400">
            <tr>
              <th className="w-10 px-3 py-2" />
              <th className="px-3 py-2">Document</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Revision</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Effective</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => {
              const checked = selectedIds.has(item.id);
              return (
                <tr key={item.id} onClick={() => toggle(item)} className={cn("cursor-pointer border-t border-white/5 hover:bg-white/[.04]", checked && "bg-primary/10")}>
                  <td className="px-3 py-3"><span className={cn("block h-4 w-4 rounded border", checked ? "border-primary bg-primary" : "border-white/20")} /></td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <FileText size={14} className="text-primary" />
                      <div>
                        <div className="font-semibold text-slate-100">{item.document_number ?? item.documentNumber ?? "No number"}</div>
                        <div className="text-slate-400">{item.title ?? "Untitled document"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-slate-300">{item.document_type ?? item.documentType ?? "Document"}</td>
                  <td className="px-3 py-3 text-slate-300">{item.revision ?? item.version ?? "Current"}</td>
                  <td className="px-3 py-3"><span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 text-[10px] font-semibold text-emerald-200">{item.status ?? "Effective"}</span></td>
                  <td className="px-3 py-3 text-slate-400">{item.effective_date ?? item.effectiveDate ?? "Not set"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!filtered.length ? <div className="p-5 text-sm text-slate-400">No engineering drawings matched this area. Link documents later or update Document Control.</div> : null}
      </div>
      <div className="flex flex-wrap justify-between gap-2 text-xs">
        <span className="text-slate-500">{selected.length} controlled document version(s) pinned</span>
        {canOpenDocuments ? <a className="text-primary hover:underline" href="/documents">Open Document Control</a> : <span className="text-slate-600">Document Control access restricted</span>}
      </div>
    </div>
  );
}
