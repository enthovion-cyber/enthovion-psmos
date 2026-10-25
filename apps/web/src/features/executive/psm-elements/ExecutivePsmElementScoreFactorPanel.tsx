'use client';

import React from 'react';
import type { PsmScoreFactor } from '../types/executive-psm-element.types';
import { PsmFactorTable } from './PsmElementShared';

interface Props {
  factors: PsmScoreFactor[];
}

export function ExecutivePsmElementScoreFactorPanel({ factors = [] }: Props) {
  return (
    <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
      <h3 className="font-bold text-base text-[var(--psm-text)]">Score Factor Model</h3>
      <p className="mt-1 text-xs text-[var(--psm-muted)]">
        Exact mathematical inputs, weights, and penalty calculations driving this element&apos;s governance score.
      </p>
      <div className="mt-4">
        <PsmFactorTable factors={factors} />
      </div>
    </div>
  );
}
