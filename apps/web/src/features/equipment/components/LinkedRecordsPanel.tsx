import { useState } from 'react';
import type { EquipmentLinkedRecord } from '@/services/equipment.service';

export function LinkedRecordsPanel({ records, filter }: { records: EquipmentLinkedRecord[]; filter?: string | undefined }) {
  const [showAll, setShowAll] = useState(false);

  const visible = filter ? records.filter((record) => record.moduleKey.toLowerCase() === filter.toLowerCase()) : records;
  
  // Slice the array to only show the first 4 if 'showAll' is false
  const displayedRecords = showAll ? visible : visible.slice(0, 3);

  return (
    <div className="psm-card p-4">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide">Linked Records</h2>
      
      {visible.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--psm-line)] p-4 text-sm text-[var(--psm-muted)]">
          No linked records for this filter.
        </div>
      ) : (
        <>
          {displayedRecords.map((record) => (
            <div key={record.id} className="mb-2 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">{record.title}</span>
                <span className="text-info">{record.moduleKey.toUpperCase()}</span>
              </div>
              <div className="mt-1 text-[var(--psm-muted)]">
                {record.recordType} · {record.status}
              </div>
            </div>
          ))}

          {/* Only show the button if there are more than 4 records */}
          {visible.length > 4 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="mt-2 text-xs font-medium text-[var(--psm-primary)] hover:underline"
            >
              {showAll ? 'Show Less' : `View All (${visible.length})`}
            </button>
          )}
        </>
      )}
    </div>
  );
}