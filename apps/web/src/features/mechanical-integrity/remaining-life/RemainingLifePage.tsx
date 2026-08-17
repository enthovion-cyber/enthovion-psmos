'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEquipmentRemainingLife } from '../hooks/useRemainingLife';
import { inspectionRecordService } from '../services/inspection-record.service';
import { MiLoadingSkeleton } from '../shared/MiLoadingSkeleton';
import { RemainingLifeCalculationPanel } from './RemainingLifeCalculationPanel';
import { RemainingLifeSummaryCards } from './RemainingLifeSummaryCards';
import { RemainingLifeTable } from './RemainingLifeTable';

export function RemainingLifePage({ equipmentId }: { equipmentId: string }) {
  const queryClient = useQueryClient();
  const query = useEquipmentRemainingLife(equipmentId);
  const recalc = useMutation({ mutationFn: () => inspectionRecordService.recalculateEquipmentRemainingLife(equipmentId), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mechanical-integrity', 'remaining-life', equipmentId] }) });
  if (query.isLoading) return <MiLoadingSkeleton rows={5} />;
  if (query.isError || !query.data) return <div className="rounded-xl border border-danger/30 bg-danger/10 p-5 text-danger">Remaining life data could not be loaded.</div>;
  return <div className="space-y-5"><header className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Mechanical Integrity</p><h1 className="text-2xl font-bold text-[var(--psm-text)]">Remaining Life / Corrosion Rate</h1><p className="text-sm text-[var(--psm-muted)]">Backend-calculated remaining life from official UT readings.</p></header><RemainingLifeSummaryCards data={query.data} /><RemainingLifeCalculationPanel onRecalculate={() => recalc.mutate()} saving={recalc.isPending} /><RemainingLifeTable rows={query.data.rows ?? []} /></div>;
}
