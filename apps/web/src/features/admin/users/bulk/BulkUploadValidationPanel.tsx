'use client';

export function BulkUploadValidationPanel() {
  return (
    <section className="psm-card p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide">Bulk Validation</h2>
      <p className="mt-2 text-sm text-[var(--psm-muted)]">Upload jobs validate required columns, duplicates, existing emails, role resolution, and row-level errors before import.</p>
    </section>
  );
}
