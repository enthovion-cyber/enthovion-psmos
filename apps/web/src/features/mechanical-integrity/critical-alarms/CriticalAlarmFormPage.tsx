'use client';

import { useRouter } from 'next/navigation';
import { MiLoadingSkeleton } from '../shared/MiLoadingSkeleton';
import { useCriticalAlarmDetail, useCriticalAlarmMutations } from '../hooks/useCriticalAlarms';
import { SafeguardSimpleForm } from '../safeguards/SafeguardSimpleForm';

export function CriticalAlarmFormPage({ alarmId }: { alarmId?: string }) {
  const router = useRouter();
  const detail = useCriticalAlarmDetail(alarmId);
  const mutations = useCriticalAlarmMutations();
  if (alarmId && detail.isLoading) return <MiLoadingSkeleton rows={6} />;
  const record = (detail.data as any)?.alarm ?? (detail.data as any)?.record;
  return <SafeguardSimpleForm kind="Critical Alarm" mode={alarmId ? 'edit' : 'create'} initial={record} saving={mutations.create.isPending || mutations.update.isPending} onCancel={() => router.back()} onSubmit={async (input) => { const result = alarmId ? await mutations.update.mutateAsync({ alarmId, input }) : await mutations.create.mutateAsync(input); const row = (result as any).alarm ?? (result as any).record; router.push(`/mechanical-integrity/critical-alarms/${row?.id ?? alarmId}`); }} />;
}
