'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronRight, AlertCircle, Clock, FileText } from 'lucide-react';
import type { PsmElementScore } from '../types/executive-psm-element.types';
import { ExecutivePsmElementStatusBadge } from '../shared/ExecutivePsmElementStatusBadge';
import { ExecutivePsmElementCategoryBadge } from '../shared/ExecutivePsmElementCategoryBadge';

interface Props {
  scorecards: PsmElementScore[];
}

export function ExecutivePsmElementScorecardGrid({ scorecards = [] }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {scorecards.map((card) => {
        const score = card.score_value;
        const status = card.element_status ?? 'Insufficient Data';

        return (
          <div
            key={card.element_id ?? card.id}
            className="flex flex-col justify-between rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 shadow-sm transition hover:border-[var(--psm-primary)]"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[var(--psm-muted)]">
                  {card.element_code}
                </span>
                <ExecutivePsmElementStatusBadge status={status} />
              </div>

              <h3 className="mt-2 text-base font-bold text-[var(--psm-text)]">
                {card.element_name}
              </h3>

              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-[var(--psm-text)]">
                  {score != null ? score : '—'}
                </span>
                <span className="text-xs text-[var(--psm-muted)]">/ 100 PSM Health</span>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 border-t border-[var(--psm-line)] pt-3 text-center text-xs">
                <div>
                  <div className="font-bold text-rose-500">{card.critical_item_count ?? 0}</div>
                  <div className="text-[10px] text-[var(--psm-muted)]">Critical</div>
                </div>
                <div>
                  <div className="font-bold text-amber-500">{card.overdue_action_count ?? 0}</div>
                  <div className="text-[10px] text-[var(--psm-muted)]">Overdue</div>
                </div>
                <div>
                  <div className="font-bold text-orange-500">{card.missing_evidence_count ?? 0}</div>
                  <div className="text-[10px] text-[var(--psm-muted)]">Missing Ev.</div>
                </div>
              </div>
            </div>

            <div className="mt-4 border-t border-[var(--psm-line)] pt-3">
              <Link
                href={`/executive/psm-elements/${card.element_id}`}
                className="flex items-center justify-between text-xs font-semibold text-[var(--psm-primary)] hover:underline"
              >
                <span>Element Detail</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
