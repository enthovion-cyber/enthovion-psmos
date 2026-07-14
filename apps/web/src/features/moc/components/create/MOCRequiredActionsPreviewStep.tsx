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
      <div className="space-y-2">
        {preview.data?.map((action, index) => <div key={`${action.title}-${index}`} className="rounded-lg border border-cyan-300/10 bg-slate-950/35 p-3"><div className="flex items-center justify-between gap-3"><h3 className="font-bold text-white">{action.title}</h3><span className="rounded-full border border-white/10 px-2 py-1 text-xs font-bold text-slate-300">{action.priority}</span></div><p className="mt-1 text-sm text-slate-400">{action.description}</p><p className="mt-2 text-xs text-blue-200">System-required action · cannot be deleted</p></div>)}
        {!preview.data?.length ? <p className="rounded-lg border border-dashed border-cyan-300/20 p-6 text-center text-sm text-slate-400">No required actions generated yet. Impact answers will generate SOP, P&ID, SDS, PSI, Training, HAZOP, LOPA, Equipment Registry, Document Control, and PSSR actions.</p> : null}
      </div>
    </StepShell>
  );
}
