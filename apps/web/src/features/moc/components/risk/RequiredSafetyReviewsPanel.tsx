'use client';

import { ShieldCheck } from 'lucide-react';
import { Badge, DetailCard, EmptyState, MocButton } from '../moc-detail-ui';

export function RequiredSafetyReviewsPanel({
  requirements,
  onApply,
  applying
}: {
  requirements: any[];
  onApply: () => void;
  applying?: boolean;
}) {
  return (
    <DetailCard
      title="HAZOP & PHA Safety Reviews"
      action={
        <MocButton
          variant="primary"
          onClick={onApply}
          disabled={applying || !requirements.length}
        >
          {applying ? 'Applying...' : 'Apply Requirements'}
        </MocButton>
      }
    >
      {!requirements.length ? (
        <EmptyState
          title="No generated risk reviews"
          detail="Save or recalculate the risk ranking to generate review requirements."
        />
      ) : (
        <div className="space-y-2.5">
          {requirements.map((item) => (
            <div
              key={item.id ?? `${item.review_type}-${item.source}`}
              className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-xs transition-colors"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="flex items-center gap-1.5 font-bold text-[var(--psm-fg)]">
                    <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>{item.title}</span>
                  </p>
                  <p className="mt-1 leading-relaxed text-[var(--psm-muted)]">{item.description}</p>
                </div>
                <Badge tone={item.status === 'Action Created' ? 'green' : item.status === 'Preview' ? 'blue' : 'amber'}>
                  {item.status}
                </Badge>
              </div>
              <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[var(--psm-muted)]">
                <span>Owner: <strong className="text-[var(--psm-fg)]">{item.owner_role ?? '-'}</strong></span>
                <span>Before Approval: <strong className="text-[var(--psm-fg)]">{item.required_before_approval ? 'Yes' : 'No'}</strong></span>
                <span>Before Startup: <strong className="text-[var(--psm-fg)]">{item.required_before_startup ? 'Yes' : 'No'}</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}
    </DetailCard>
  );
}
