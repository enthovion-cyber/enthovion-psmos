'use client';

import { useQuery } from '@tanstack/react-query';
import { miEquipmentService } from '../services/equipment.service';
import { MiLoadingSkeleton } from '../shared/MiLoadingSkeleton';

export function EquipmentHistoryTab({ id }: { id: string }) {
  const query = useQuery({ queryKey: ['mechanical-integrity', 'equipment', id, 'history'], queryFn: () => miEquipmentService.history(id) });
  if (query.isLoading) return <MiLoadingSkeleton rows={4} />;
  if (query.isError || !query.data) return <div className="psm-card p-6 text-danger">History unavailable.</div>;
  return (
    <section className="psm-card p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide">Equipment History</h2>
      <div className="mt-4 divide-y divide-[var(--psm-line)]">
        {query.data.length === 0 ? <p className="text-sm text-[var(--psm-muted)]">No MI history events yet.</p> : query.data.map((event, index) => (
          <div key={String(event.id ?? index)} className="py-3"><div className="font-semibold">{String(event.title ?? event.eventType ?? 'History event')}</div><div className="text-xs text-[var(--psm-muted)]">{String(event.occurredAt ?? event.created_at ?? '')}</div></div>
        ))}
      </div>
    </section>
  );
}
