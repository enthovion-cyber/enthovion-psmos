'use client';

import React from 'react';
import type { PsmElementDetail } from '../../types/executive-psm-element.types';
import { PsmSourceTraceTable } from '../PsmElementShared';

interface Props {
  detail: PsmElementDetail;
}

export function PsmElementSourceTraceTab({ detail }: Props) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5">
        <h3 className="font-bold text-base text-[var(--psm-text)]">Permitted Source Trace Audit Trail</h3>
        <p className="mt-1 text-xs text-[var(--psm-muted)]">
          Audit verification showing contributing records, excluded records, and permission-masked source data.
        </p>
        <div className="mt-4">
          <PsmSourceTraceTable rows={detail.sourceTrace} />
        </div>
      </div>
    </div>
  );
}
