'use client';

import React from 'react';
import type { PsmElementDetail } from '../../types/executive-psm-element.types';
import { PsmGapTable } from '../PsmElementShared';

interface Props {
  detail: PsmElementDetail;
}

export function PsmElementGapsTab({ detail }: Props) {
  const gaps = detail.gaps ?? [];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5">
        <h3 className="font-bold text-base text-[var(--psm-text)]">Open Gaps & Blockers</h3>
        <p className="mt-1 text-xs text-[var(--psm-muted)]">
          Process safety gaps, missing verifications, overdue inspections, and unclosed audit findings.
        </p>
        <div className="mt-4">
          <PsmGapTable gaps={gaps} />
        </div>
      </div>
    </div>
  );
}
