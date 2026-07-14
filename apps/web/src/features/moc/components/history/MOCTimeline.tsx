'use client';

import { DetailCard, EmptyState } from '../moc-detail-ui';
import { MOCHistoryEventCard } from './MOCHistoryEventCard';

export function MOCTimeline({ events, onOpen }: { events: any[]; onOpen: (event: any) => void }) {
  return (
    <DetailCard title="MOC Timeline">
      {events?.length ? (
        <div className="relative space-y-4 before:absolute before:left-3 before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-cyan-300/15">
          {events.map((event) => (
            <div key={event.id} className="relative pl-8">
              <span className="absolute left-1.5 top-5 h-3 w-3 rounded-full border border-cyan-200/50 bg-blue-500 shadow-lg shadow-blue-500/30" />
              <MOCHistoryEventCard event={event} onOpen={onOpen} />
            </div>
          ))}
        </div>
      ) : <EmptyState title="No history events match the current filters." detail="Every MOC create, update, approval, training, attachment, and system action will appear here." />}
    </DetailCard>
  );
}
