'use client';

import React from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface Props {
  actions: any[];
}

export function ExecutiveScopeOverdueActionsPanel({ actions = [] }: Props) {
  return (
    <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
      <div className="flex items-center gap-2 border-b border-[var(--psm-line)] pb-3">
        <Clock className="h-5 w-5 text-amber-500" />
        <h3 className="font-bold text-[var(--psm-text)]">Overdue Actions & CAPA</h3>
        <span className="ml-auto rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-400">
          {actions.length} Overdue
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {actions.map((action, index) => (
          <div
            key={action.id ?? index}
            className="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3.5 transition hover:bg-amber-500/10"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-500 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-semibold text-sm text-[var(--psm-text)] truncate">{action.title ?? 'Overdue Action'}</h4>
                <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                  {action.overdueDays ? `${action.overdueDays}d overdue` : 'Overdue'}
                </span>
              </div>
              <p className="mt-1 text-xs text-[var(--psm-muted)]">{action.description ?? 'Requires immediate CAPA closure and owner sign-off.'}</p>
              <div className="mt-2 flex items-center gap-3 text-[11px] text-[var(--psm-muted)]">
                {action.owner ? <span>Owner: {action.owner}</span> : null}
                {action.dueDate ? <span>Due: {new Date(action.dueDate).toLocaleDateString()}</span> : null}
              </div>
            </div>
          </div>
        ))}

        {!actions.length ? (
          <p className="py-6 text-center text-sm text-[var(--psm-muted)]">
            No overdue actions recorded in this scope.
          </p>
        ) : null}
      </div>
    </div>
  );
}
