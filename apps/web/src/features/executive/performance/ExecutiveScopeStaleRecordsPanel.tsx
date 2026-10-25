'use client';

import React from 'react';
import { Database, AlertTriangle } from 'lucide-react';

interface Props {
  records: any[];
}

export function ExecutiveScopeStaleRecordsPanel({ records = [] }: Props) {
  return (
    <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
      <div className="flex items-center gap-2 border-b border-[var(--psm-line)] pb-3">
        <Database className="h-5 w-5 text-orange-500" />
        <h3 className="font-bold text-[var(--psm-text)]">Stale Process Safety Records</h3>
        <span className="ml-auto rounded-full bg-orange-500/15 px-2 py-0.5 text-xs font-bold text-orange-700 dark:text-orange-400">
          {records.length} Stale
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {records.map((record, index) => (
          <div
            key={record.id ?? index}
            className="flex items-start gap-3 rounded-lg border border-orange-500/20 bg-orange-500/5 p-3.5 transition hover:bg-orange-500/10"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 text-orange-500 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-semibold text-sm text-[var(--psm-text)] truncate">{record.title ?? 'Stale Record'}</h4>
                <span className="rounded bg-orange-500/20 px-1.5 py-0.5 text-[10px] font-bold text-orange-700 dark:text-orange-300">
                  {record.staleReason ?? 'Exceeds SLA'}
                </span>
              </div>
              <p className="mt-1 text-xs text-[var(--psm-muted)]">{record.description ?? 'Record has not been refreshed within maximum permitted freshness window.'}</p>
              {record.lastUpdated ? (
                <span className="mt-2 inline-block text-[11px] text-[var(--psm-muted)]">
                  Last updated: {new Date(record.lastUpdated).toLocaleDateString()}
                </span>
              ) : null}
            </div>
          </div>
        ))}

        {!records.length ? (
          <p className="py-6 text-center text-sm text-[var(--psm-muted)]">
            No stale records detected for this scope.
          </p>
        ) : null}
      </div>
    </div>
  );
}
