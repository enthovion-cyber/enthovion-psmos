export function ChecklistPreviewPanel() {
  return (
    <div className="rounded-xl border border-dashed border-[var(--psm-line)] p-5 text-sm text-[var(--psm-muted)]">
      <strong>Future Execution Preview</strong>
      <p className="mt-2">
        Checklist structure only. Responses, findings, evidence, scores, and
        CAPA are intentionally not generated in Phase 3.
      </p>
    </div>
  );
}
