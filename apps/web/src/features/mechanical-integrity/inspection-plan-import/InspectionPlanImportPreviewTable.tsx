export function InspectionPlanImportPreviewTable({ rows }: { rows: Array<Record<string, unknown>> }) {
  return <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4"><h2 className="font-bold text-[var(--psm-text)]">Preview</h2><div className="mt-3 max-h-80 overflow-auto text-xs text-[var(--psm-text)]"><pre>{JSON.stringify(rows.slice(0, 50), null, 2)}</pre></div></div>;
}
