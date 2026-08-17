'use client';

import { useState } from 'react';
import type { MiInspectionDocument } from '../../types/inspection-record.types';

export function InspectionDocumentsEvidenceSection({ rows, onAdd, saving }: { rows: MiInspectionDocument[]; onAdd?: ((input: Record<string, unknown>) => void) | undefined; saving?: boolean | undefined }) {
  const [title, setTitle] = useState('');
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
      <h2 className="font-bold text-[var(--psm-text)]">Documents / Evidence</h2>
      {onAdd ? <div className="mt-4 flex gap-2"><input className="min-w-0 flex-1 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm text-[var(--psm-text)]" placeholder="Evidence title or Document Control reference" value={title} onChange={(event) => setTitle(event.target.value)} /><button className="rounded-lg border border-[var(--psm-line)] px-3 py-2 text-sm font-semibold" disabled={saving || !title} onClick={() => onAdd({ title, documentType: 'Evidence' })}>Link Evidence</button></div> : null}
      <div className="mt-4 grid gap-2">{rows.length ? rows.map((row) => <div key={row.id} className="rounded-lg border border-[var(--psm-line)] p-3 text-sm"><span className="font-semibold text-[var(--psm-text)]">{row.title}</span><span className="ml-2 text-[var(--psm-muted)]">{row.document_type ?? 'Evidence'} • {row.status ?? 'Linked'}</span></div>) : <p className="text-sm text-[var(--psm-muted)]">No evidence linked yet.</p>}</div>
    </section>
  );
}
