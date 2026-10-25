'use client';

import React from 'react';
import type { PsmElementDetail } from '../../types/executive-psm-element.types';
import { PsmGapTable } from '../PsmElementShared';

interface Props {
  detail: PsmElementDetail;
}

export function PsmElementActionsTab({ detail }: Props) {
  const actions = (detail.gaps ?? []).filter((g) => g.gap_type === 'Overdue Action' || g.gap_type === 'Action');

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5">
        <h3 className="font-bold text-base text-[var(--psm-text)]">Action / CAPA Remediation Backlog</h3>
        <p className="mt-1 text-xs text-[var(--psm-muted)]">
          Corrective and preventive actions linked to this element awaiting closure or verification.
        </p>
        <div className="mt-4">
          <PsmGapTable gaps={actions.length ? actions : detail.gaps} />
        </div>
      </div>
    </div>
  );
}
