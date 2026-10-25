'use client';

import React from 'react';
import type { ExecutiveScopeType } from '../types/executive-performance.types';

export function ExecutiveScopeTypeBadge({ type }: { type: ExecutiveScopeType }) {
  return (
    <span className="inline-flex items-center rounded bg-[var(--psm-surface-2)] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--psm-muted)]">
      {type}
    </span>
  );
}

export { ExecutiveScopeTypeBadge as ScopeTypeBadge };
