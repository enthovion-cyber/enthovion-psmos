'use client';

import { ActionButton } from '../safeguards/SafeguardUiPrimitives';

export function ImpairmentBulkActions() {
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Bulk Actions / Export</h2>
          <p className="text-sm text-[var(--psm-muted)]">Bulk workflow changes are permission-controlled by the backend. Export uses the current secure API scope.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ActionButton title="Select records first" disabled>Bulk Submit</ActionButton>
          <ActionButton title="Select active records first" disabled>Bulk Reminder</ActionButton>
          <ActionButton onClick={() => window.open('/api/v1/mechanical-integrity/bypass-impairments/export', '_blank')}>Export Register</ActionButton>
        </div>
      </div>
    </section>
  );
}
