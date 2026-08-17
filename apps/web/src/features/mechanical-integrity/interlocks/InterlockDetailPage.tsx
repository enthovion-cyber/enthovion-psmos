'use client';

import { useRouter } from 'next/navigation';
import { useInterlockDetail, useInterlockMutations } from '../hooks/useInterlocks';
import { MiLoadingSkeleton } from '../shared/MiLoadingSkeleton';
import { ActionButton, KeyValueGrid, PrimaryButton, SectionCard, cardValue } from '../safeguards/SafeguardUiPrimitives';

export function InterlockDetailPage({ interlockId }: { interlockId: string }) {
  const router = useRouter();
  const query = useInterlockDetail(interlockId);
  const mutations = useInterlockMutations();
  if (query.isLoading) return <MiLoadingSkeleton rows={6} />;
  const row = (query.data as any)?.interlock ?? (query.data as any)?.record;
  if (query.isError || !row) return <div className="rounded-xl border border-danger/30 bg-danger/10 p-5 text-danger">Interlock could not be loaded.</div>;
  return <div className="space-y-5"><header className="flex flex-col gap-3 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-xs font-semibold uppercase tracking-wide text-[var(--psm-muted)]">Interlock Detail</p><h1 className="text-2xl font-bold">{cardValue(row.interlockTag ?? row.interlock_tag)} - {cardValue(row.interlockName ?? row.interlock_name)}</h1><p className="text-sm text-[var(--psm-muted)]">{cardValue(row.description, 'No description recorded.')}</p></div><div className="flex flex-wrap gap-2"><PrimaryButton onClick={() => router.push(`/mechanical-integrity/interlocks/${interlockId}/edit`)}>Edit</PrimaryButton><ActionButton onClick={() => mutations.archive.mutate({ interlockId, reason: 'Archived from detail page' })}>Archive</ActionButton></div></header><SectionCard title="Interlock Basis" description="Real backend detail including equipment, cause/effect, schedule, bypass, and readiness fields."><KeyValueGrid items={Object.entries(row).slice(0, 18) as any} /></SectionCard></div>;
}
