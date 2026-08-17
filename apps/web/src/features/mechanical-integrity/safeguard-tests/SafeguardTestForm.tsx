'use client';

import { useState } from 'react';
import { ActionButton, PrimaryButton } from '../safeguards/SafeguardUiPrimitives';
import { SafeguardTestContextSection } from './sections/SafeguardTestContextSection';
import { SafeguardTestExecutionSection } from './sections/SafeguardTestExecutionSection';
import { SafeguardTestEvaluationSection } from './sections/SafeguardTestEvaluationSection';
import { SafeguardTestEvidenceSection } from './sections/SafeguardTestEvidenceSection';
import { SafeguardTestReviewSection } from './sections/SafeguardTestReviewSection';

export function SafeguardTestForm({ mode, initial, saving, onSubmit, onCancel }: { mode: 'create' | 'edit'; initial?: Record<string, any>; saving?: boolean; onSubmit: (input: Record<string, unknown>) => Promise<void>; onCancel: () => void }) {
  const [form, setForm] = useState<Record<string, any>>(() => initial ?? { status: 'Draft' });
  const set = (patch: Record<string, any>) => setForm((current) => ({ ...current, ...patch }));
  return <form className="space-y-5" onSubmit={async (event) => { event.preventDefault(); await onSubmit(form); }}><header className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5"><p className="text-xs font-semibold uppercase tracking-wide text-[var(--psm-muted)]">{mode === 'create' ? 'Create Test' : 'Edit Test'}</p><h1 className="text-2xl font-bold">Safeguard Test Execution</h1><p className="text-sm text-[var(--psm-muted)]">Context, test procedure, step results, as-found/as-left condition, bypass state, evidence, evaluation, and review.</p></header><SafeguardTestContextSection value={form} onChange={set} /><SafeguardTestExecutionSection value={form} onChange={set} /><SafeguardTestEvaluationSection value={form} onChange={set} /><SafeguardTestEvidenceSection value={form} onChange={set} /><SafeguardTestReviewSection value={form} onChange={set} /><div className="sticky bottom-0 flex justify-end gap-2 border-t border-[var(--psm-line)] bg-[var(--psm-bg)] py-4"><ActionButton onClick={onCancel}>Cancel</ActionButton><PrimaryButton type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Test'}</PrimaryButton></div></form>;
}
