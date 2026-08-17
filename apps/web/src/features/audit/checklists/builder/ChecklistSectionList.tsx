import { AuditButton } from "../../shared/AuditUi";
export function ChecklistSectionList({
  sections,
  selected,
  onSelect,
  onAdd,
}: {
  sections: any[];
  selected?: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
}) {
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Sections</h2>
        <AuditButton onClick={onAdd}>Add</AuditButton>
      </div>
      <div className="mt-3 space-y-2">
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            className={`w-full rounded-lg border p-3 text-left ${selected === s.id ? "border-primary bg-primary/10" : "border-[var(--psm-line)]"}`}
          >
            <span className="text-xs text-[var(--psm-muted)]">
              {s.section_code} · {s.section_order}
            </span>
            <p className="font-semibold">{s.section_title}</p>
          </button>
        ))}
      </div>
    </section>
  );
}
