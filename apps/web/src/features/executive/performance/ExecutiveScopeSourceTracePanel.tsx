'use client';

import React from 'react';
import { FileText, Shield } from 'lucide-react';

interface Props {
  sourceTrace: any[];
}

export function ExecutiveScopeSourceTracePanel({ sourceTrace = [] }: Props) {
  return (
    <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-[var(--psm-line)] pb-3">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-[var(--psm-primary)]" />
          <h3 className="font-bold text-[var(--psm-text)]">Source Trace Audit Trail</h3>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[var(--psm-muted)]">
          <Shield className="h-4 w-4" />
          <span>Restricted details masked</span>
        </div>
      </div>

      <p className="mt-2 text-xs text-[var(--psm-muted)]">
        Permitted source record contributions, exclusions, and calculation weights.
      </p>

      <div className="mt-4 max-h-80 overflow-y-auto rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-xs font-mono">
        {sourceTrace.length ? (
          <pre className="whitespace-pre-wrap text-[var(--psm-text)]">
            {JSON.stringify(sourceTrace, null, 2)}
          </pre>
        ) : (
          <p className="py-6 text-center font-sans text-sm text-[var(--psm-muted)]">
            No permitted source trace records are available for this scope.
          </p>
        )}
      </div>
    </div>
  );
}
