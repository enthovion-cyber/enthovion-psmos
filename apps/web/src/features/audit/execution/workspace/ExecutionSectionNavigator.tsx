import { AuditChecklistResponseStatusBadge } from "../../shared/AuditChecklistResponseStatusBadge";
import type { AuditExecutionItem, AuditExecutionSection } from "../../types/audit-execution.types";

export function ExecutionSectionNavigator({ sections, items, activeSectionId, onSelect }: { sections: AuditExecutionSection[]; items: AuditExecutionItem[]; activeSectionId?: string | undefined; onSelect: (id: string) => void }) {
  return (
    <div className="space-y-2">
      {sections.map((section) => (
        <button key={section.id} type="button" onClick={() => onSelect(section.id)} className={`w-full rounded-lg border p-3 text-left ${activeSectionId === section.id ? "border-primary bg-primary/10" : "border-[var(--psm-line)] bg-[var(--psm-surface-2)]"}`}>
          <div className="flex items-start justify-between gap-2"><div><p className="font-semibold text-[var(--psm-fg)]">{section.section_code}</p><p className="text-sm text-[var(--psm-muted)]">{section.section_title}</p></div><AuditChecklistResponseStatusBadge status={section.section_status} /></div>
          <p className="mt-2 text-xs text-[var(--psm-muted)]">{items.filter((item) => item.execution_section_id === section.id).length} item(s)</p>
        </button>
      ))}
    </div>
  );
}
