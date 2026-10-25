'use client';

import React from 'react';
import { AlertCircle, ShieldAlert } from 'lucide-react';

interface Props {
  alerts: any[];
}

export function ExecutiveScopeCriticalAlertsPanel({ alerts = [] }: Props) {
  return (
    <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
      <div className="flex items-center gap-2 border-b border-[var(--psm-line)] pb-3">
        <ShieldAlert className="h-5 w-5 text-red-500" />
        <h3 className="font-bold text-[var(--psm-text)]">Critical Process Safety Alerts</h3>
        <span className="ml-auto rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-bold text-red-700 dark:text-red-400">
          {alerts.length} Critical
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {alerts.map((alert, index) => (
          <div
            key={alert.id ?? index}
            className="flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/5 p-3.5 transition hover:bg-red-500/10"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 text-red-500 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-semibold text-sm text-[var(--psm-text)] truncate">{alert.title ?? 'Critical Alert'}</h4>
                <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] font-bold uppercase text-red-700 dark:text-red-300">
                  {alert.severity ?? 'Critical'}
                </span>
              </div>
              <p className="mt-1 text-xs text-[var(--psm-muted)]">{alert.description ?? alert.message ?? 'Immediate supervisory verification required.'}</p>
              {alert.sourceModule ? (
                <span className="mt-2 inline-block rounded bg-[var(--psm-surface-2)] px-2 py-0.5 text-[10px] font-medium text-[var(--psm-muted)]">
                  Module: {alert.sourceModule}
                </span>
              ) : null}
            </div>
          </div>
        ))}

        {!alerts.length ? (
          <p className="py-6 text-center text-sm text-[var(--psm-muted)]">
            No active critical process safety alerts in this scope.
          </p>
        ) : null}
      </div>
    </div>
  );
}
