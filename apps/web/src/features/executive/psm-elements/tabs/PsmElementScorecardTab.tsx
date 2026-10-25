'use client';

import React from 'react';
import type { PsmElementDetail } from '../../types/executive-psm-element.types';
import { PsmFactorTable } from '../PsmElementShared';

interface Props {
  detail: PsmElementDetail;
}

export function PsmElementScorecardTab({ detail }: Props) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5">
        <h3 className="font-bold text-base text-[var(--psm-text)]">Score Factor Contribution Breakdown</h3>
        <p className="mt-1 text-xs text-[var(--psm-muted)]">
          Deterministic mathematical weighting of KPI scores, critical gap penalties, overdue action load, and data readiness.
        </p>
        <div className="mt-4">
          <PsmFactorTable factors={detail.factors} />
        </div>
      </div>
    </div>
  );
}
