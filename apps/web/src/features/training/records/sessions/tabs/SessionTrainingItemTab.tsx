'use client';

import { TrainingCard } from '../../../shared/TrainingUi';

export function SessionTrainingItemTab({ session }: { session: Record<string, any> }) {
  return <TrainingCard title="Training Item / Version"><dl className="grid gap-3 text-sm md:grid-cols-3">{Object.entries({ 'Training item': session.training_title ?? session.training_item_id, Version: session.training_item_version, Category: session.training_category, Type: session.training_type, 'Safety critical': session.safety_critical ? 'Yes' : 'No', 'PTW critical': session.ptw_critical ? 'Yes' : 'No', 'MOC critical': session.moc_critical ? 'Yes' : 'No', 'PSSR critical': session.pssr_critical ? 'Yes' : 'No' }).map(([k, v]) => <div key={k} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><dt className="text-xs uppercase text-[var(--psm-muted)]">{k}</dt><dd className="mt-1 font-semibold">{String(v ?? '-')}</dd></div>)}</dl></TrainingCard>;
}
