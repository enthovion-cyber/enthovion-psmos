import { AuditButton } from "../../shared/AuditUi";
import { AuditQuestionTypeBadge } from "../../shared/AuditQuestionTypeBadge";
export function ChecklistItemList({
  items,
  selected,
  onSelect,
  onAdd,
}: {
  items: any[];
  selected?: string | undefined;
  onSelect: (id: string) => void;
  onAdd: () => void;
}) {
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Questions / Items</h2>
        <AuditButton onClick={onAdd}>Add Item</AuditButton>
      </div>
      <div className="mt-3 space-y-2">
        {items.map((i) => (
          <button
            key={i.id}
            onClick={() => onSelect(i.id)}
            className={`w-full rounded-lg border p-3 text-left ${selected === i.id ? "border-primary bg-primary/10" : "border-[var(--psm-line)]"}`}
          >
            <div className="flex flex-wrap justify-between gap-2">
              <span className="text-xs text-[var(--psm-muted)]">
                {i.item_code} · {i.item_order}
              </span>
              <AuditQuestionTypeBadge value={i.question_type} />
            </div>
            <p className="mt-2 font-medium">{i.item_text}</p>
            {i.safety_critical || i.regulatory_critical || i.psm_critical ? (
              <p className="mt-2 text-xs font-semibold text-danger">
                Critical control question
              </p>
            ) : null}
          </button>
        ))}
      </div>
    </section>
  );
}
