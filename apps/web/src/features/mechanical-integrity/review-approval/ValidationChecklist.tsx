import { ValidationStatusBadge } from '../shared/ValidationStatusBadge';
import { ReviewCard, EmptyPanel } from './ReviewApprovalPrimitives';
import type { MiApprovalValidation } from '../types/review-approval.types';

export function ValidationChecklist({ validations }: { validations?: MiApprovalValidation[] }) {
  return (
    <ReviewCard title="Blockers / Validation Checklist" description="Backend-controlled approval prerequisites and override-safe blocker checks.">
      {!validations?.length ? <EmptyPanel>No validation results are available. Run validations before decision.</EmptyPanel> : (
        <div className="space-y-2">
          {validations.map((item) => (
            <div key={item.id} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-semibold">{item.validation_title}</p>
                  <p className="text-sm text-[var(--psm-muted)]">{item.message}</p>
                  {item.override_reason ? <p className="mt-1 text-xs text-warning">Override: {item.override_reason}</p> : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <ValidationStatusBadge status={item.validation_status} />
                  <span className="rounded-full border border-[var(--psm-line)] px-2.5 py-1 text-xs text-[var(--psm-muted)]">{item.severity}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </ReviewCard>
  );
}
