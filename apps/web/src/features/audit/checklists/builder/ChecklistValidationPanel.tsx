export function ChecklistValidationPanel({ readiness }: { readiness: any }) {
  const missing = readiness?.missing_items_json ?? [];
  return (
    <div
      className={`rounded-xl border p-4 ${missing.length ? "border-amber-500/30 bg-amber-500/10" : "border-emerald-500/30 bg-emerald-500/10"}`}
    >
      <h3 className="font-semibold">Validation</h3>
      <p className="mt-2 text-sm">
        {missing.length
          ? `Missing: ${missing.join(", ")}`
          : "Checklist is structurally ready for future execution."}
      </p>
    </div>
  );
}
