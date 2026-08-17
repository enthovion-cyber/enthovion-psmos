'use client';

import type { MiCmlReading } from '../types/cml.types';

export function CmlReadingTrendCard({ readings }: { readings: MiCmlReading[] }) {
  const approved = readings.filter((reading) => reading.review_status === 'Approved');
  return <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm"><h3 className="font-bold text-[var(--psm-text)]">Reading Trend Preview</h3>{approved.length < 2 ? <p className="mt-3 text-sm text-[var(--psm-muted)]">At least two approved readings are required to show a trend preview.</p> : <div className="mt-4 flex h-24 items-end gap-2">{approved.slice().reverse().map((reading) => <div key={reading.id} className="min-w-10 rounded-t bg-primary/70" style={{ height: `${Math.max(Number(reading.thickness_value ?? 0), 5)}px` }} title={`${reading.reading_date}: ${reading.thickness_value}`} />)}</div>}</section>;
}
