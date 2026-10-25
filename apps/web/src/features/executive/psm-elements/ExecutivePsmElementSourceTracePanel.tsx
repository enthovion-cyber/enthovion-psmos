'use client';

import React from 'react';
import type { PsmSourceTrace } from '../types/executive-psm-element.types';
import { PsmSourceTraceTable } from './PsmElementShared';

interface Props {
  rows: PsmSourceTrace[];
}

export function ExecutivePsmElementSourceTracePanel({ rows = [] }: Props) {
  return (
    <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
      <h3 className="font-bold text-base text-[var(--psm-text)]">Source Trace Audit Records</h3>
      <p className="mt-1 text-xs text-[var(--psm-muted)]">
        Line-item telemetry traces from underlying modules contributing to element calculations.
      </p>
      <div className="mt-4">
        <PsmSourceTraceTable rows={rows} />
      </div>
    </div>
  );
}
