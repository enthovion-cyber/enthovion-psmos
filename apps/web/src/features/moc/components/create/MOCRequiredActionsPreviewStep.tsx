'use client';

import { useQuery } from '@tanstack/react-query';
import { useFormContext } from 'react-hook-form';
import { mocService } from '../../services/moc.service';
import type { MOCCreateValues } from '../../schemas/moc.schema';
import { StepShell } from './create-ui';

export function MOCRequiredActionsPreviewStep() {
  const { watch } = useFormContext<MOCCreateValues>();
  const values = watch();
  const preview = useQuery({ queryKey: ['moc', 'generated-actions-preview', values.impactAssessment, values.risk, values.changeType], queryFn: () => mocService.generatedActionsPreview(values), retry: 1 });
  return (
    <StepShell eyebrow="Step 8" title="Required Actions Preview">
      <div className="space-y-3">
        {preview.data?.map((action, index) => (
          <div key={`${action.title}-${index}`} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-bold text-[var(--psm-fg)]">{action.title}</h3>
              <span className="rounded-full border border-[var(--psm-line)] bg-[var(--psm-surface)] px-2.5 py-0.5 text-xs font-bold text-[var(--psm-fg)]">{action.priority}</span>
            </div>
            <p className="mt-1 text-sm text-[var(--psm-muted)]">{action.description}</p>
            <p className="mt-2 text-xs font-bold text-primary">System-required action · cannot be bypassed</p>
          </div>
        ))}
        {!preview.data?.length ? (
          <p className="rounded-xl border border-dashed border-[var(--psm-line)] p-8 text-center text-sm text-[var(--psm-muted)]">No required actions generated yet. Impact answers will automatically generate SOP, P&ID, SDS, PSI, Training, HAZOP, LOPA, Equipment Registry, Document Control, and PSSR actions.</p>
        ) : null}
      </div>
    </StepShell>
  );
}
