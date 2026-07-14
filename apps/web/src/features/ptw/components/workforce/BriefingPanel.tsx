import { zodResolver } from '@hookform/resolvers/zod';
import { ClipboardCheck, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { briefingSchema, defaultBriefingValues } from '../../schemas/workforce.schema';
import type { BriefingValues } from '../../schemas/workforce.schema';
import type { BriefingRecord, PermitWorkerRecord } from '../../services/ptw-workforce.service';

export function BriefingPanel({ workers, briefings, onCreate, onBulkBriefing }: { workers: PermitWorkerRecord[]; briefings: BriefingRecord[]; onCreate: (values: BriefingValues) => void; onBulkBriefing: () => void }) {
  const form = useForm<BriefingValues>({ resolver: zodResolver(briefingSchema), defaultValues: defaultBriefingValues() });
  const required = workers.filter((worker) => worker.briefing_required !== false);
  const acknowledged = required.filter((worker) => worker.briefing_completed === true || worker.signed_briefing === true);
  const missing = required.filter((worker) => worker.briefing_completed !== true && worker.signed_briefing !== true);
  const latest = briefings[0];
  return (
    <section className="psm-card p-5">
      <div className="mb-4 flex items-center justify-between"><h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide"><ClipboardCheck size={16} /> Briefing / Toolbox Talk</h3><button className="psm-button psm-button-secondary" onClick={onBulkBriefing}>Mark All Briefed</button></div>
      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="grid gap-3 md:grid-cols-2">
          <Info label="Briefing Required" value={required.length ? 'Yes' : 'No'} />
          <Info label="Briefing Topic" value={latest?.briefing_topic ?? '-'} />
          <Info label="Briefing Conducted By" value={latest?.conducted_by ?? '-'} />
          <Info label="Briefing Date/Time" value={latest?.conducted_at ? new Date(latest.conducted_at).toLocaleString() : '-'} />
          <Info label="Workers Acknowledged" value={`${acknowledged.length}/${required.length}`} />
          <Info label="Missing Acknowledgements" value={String(missing.length)} />
          <div className="md:col-span-2 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4"><div className="text-xs font-semibold uppercase tracking-wide text-[var(--psm-muted)]">Toolbox Talk Notes</div><p className="mt-2 text-sm">{latest?.briefing_notes ?? 'No toolbox talk notes recorded.'}</p></div>
        </div>
        <form className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4" onSubmit={form.handleSubmit(onCreate)}>
          <div className="mb-3 font-semibold">Create Briefing</div>
          <div className="grid gap-3">
            <Field label="Briefing Title" {...form.register('briefingTitle')} error={form.formState.errors.briefingTitle?.message} />
            <Field label="Briefing Topic" {...form.register('briefingTopic')} error={form.formState.errors.briefingTopic?.message} />
            <Field label="Conducted By" {...form.register('conductedBy')} />
            <Field label="Conducted At" type="datetime-local" {...form.register('conductedAt')} error={form.formState.errors.conductedAt?.message} />
            <textarea className="psm-input min-h-20" placeholder="Briefing notes" {...form.register('briefingNotes')} />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...form.register('requiredForAllWorkers')} /> Required for all workers</label>
            <button className="psm-button psm-button-primary" type="submit"><Save size={15} /> Save Briefing</button>
          </div>
        </form>
      </div>
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4"><div className="text-xs font-semibold uppercase tracking-wide text-[var(--psm-muted)]">{label}</div><div className="mt-2 font-semibold">{value}</div></div>;
}

function Field({ label, error, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string | undefined }) {
  return <label className="block"><span className="text-xs font-semibold text-[var(--psm-muted)]">{label}</span><input className="psm-input mt-1 w-full" {...props} />{error ? <span className="mt-1 block text-xs text-danger">{error}</span> : null}</label>;
}
