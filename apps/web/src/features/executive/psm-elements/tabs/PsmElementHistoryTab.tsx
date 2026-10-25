'use client';

import React from 'react';
import type { PsmElementDetail } from '../../types/executive-psm-element.types';

interface Props {
  detail: PsmElementDetail;
}

export function PsmElementHistoryTab({ detail }: Props) {
  const history = detail.history ?? [];

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] shadow-sm">
      <div className="border-b border-[var(--psm-line)] p-4">
        <h3 className="font-bold text-base text-[var(--psm-text)]">Element Governance History</h3>
        <p className="mt-1 text-xs text-[var(--psm-muted)]">
          Audit timeline of recalculations, snapshot captures, mapping updates, and score modifications.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-xs uppercase text-[var(--psm-muted)]">
            <tr>
              <th className="px-4 py-3">Event</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--psm-line)]">
            {history.map((ev: any, index: number) => (
              <tr key={ev.id ?? index} className="hover:bg-[var(--psm-surface-2)]">
                <td className="px-4 py-3.5 font-bold text-[var(--psm-text)]">{ev.event_title ?? 'Event'}</td>
                <td className="px-4 py-3.5 text-xs text-[var(--psm-muted)]">{ev.event_description ?? '—'}</td>
                <td className="px-4 py-3.5 text-xs text-[var(--psm-muted)]">
                  {ev.created_at ? new Date(ev.created_at).toLocaleString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!history.length ? (
        <div className="py-12 text-center text-sm text-[var(--psm-muted)]">
          No history events logged for this element.
        </div>
      ) : null}
    </div>
  );
}
