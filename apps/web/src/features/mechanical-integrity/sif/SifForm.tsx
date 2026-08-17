'use client';

import { useMemo, useState } from 'react';
import { ActionButton, PrimaryButton } from '../safeguards/SafeguardUiPrimitives';
import { ArchitectureVotingSection } from './sections/ArchitectureVotingSection';
import { BypassFoundationSection } from './sections/BypassFoundationSection';
import { CauseEffectSection } from './sections/CauseEffectSection';
import { DocumentsEvidenceSection } from './sections/DocumentsEvidenceSection';
import { FinalElementSection } from './sections/FinalElementSection';
import { HazardScenarioSection } from './sections/HazardScenarioSection';
import { LogicSolverSection } from './sections/LogicSolverSection';
import { LopaSilLinkSection } from './sections/LopaSilLinkSection';
import { ProofTestRequirementSection } from './sections/ProofTestRequirementSection';
import { ProtectedEquipmentSection } from './sections/ProtectedEquipmentSection';
import { ReviewSaveSection } from './sections/ReviewSaveSection';
import { SensorSection } from './sections/SensorSection';
import { SifIdentificationSection } from './sections/SifIdentificationSection';
import { SilRiskReductionSection } from './sections/SilRiskReductionSection';

export function SifForm({ mode, initial, saving, onSubmit, onCancel }: { mode: 'create' | 'edit'; initial?: Record<string, any>; saving?: boolean; onSubmit: (input: Record<string, unknown>) => Promise<void>; onCancel: () => void }) {
  const [form, setForm] = useState<Record<string, any>>(() => initial ?? { status: 'Draft', safetyCritical: true, psmCritical: true });
  const [error, setError] = useState('');
  const missing = useMemo(() => {
    const items: string[] = [];
    if (!form.sifTag && !form.sif_tag) items.push('SIF tag is required.');
    if (!form.sifName && !form.sif_name) items.push('SIF name is required.');
    if (!form.siteId && !form.site_id) items.push('Site is required.');
    if (!form.targetSil && !form.target_sil) items.push('Target SIL is required before readiness can be complete.');
    return items;
  }, [form]);
  const set = (patch: Record<string, any>) => setForm((current) => ({ ...current, ...patch }));
  return (
    <form className="space-y-5" onSubmit={async (event) => {
      event.preventDefault();
      if (missing.length && mode === 'create') {
        setError(missing.join(' '));
        return;
      }
      setError('');
      await onSubmit(form);
    }}>
      <header className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--psm-muted)]">{mode === 'create' ? 'Create SIF' : 'Edit SIF'}</p>
        <h1 className="text-2xl font-bold">SIL Determination / SIF Specification Foundation</h1>
        <p className="mt-2 text-sm text-[var(--psm-muted)]">Complete every section from the SIS/SIF PDF: identification, protected equipment, scenario, LOPA/SIL, cause/effect, architecture, devices, proof testing, bypass, documents, and readiness.</p>
      </header>
      {error ? <div className="rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger">{error}</div> : null}
      <SifIdentificationSection value={form} onChange={set} />
      <ProtectedEquipmentSection value={form} onChange={set} />
      <HazardScenarioSection value={form} onChange={set} />
      <LopaSilLinkSection value={form} onChange={set} />
      <CauseEffectSection value={form} onChange={set} />
      <ArchitectureVotingSection value={form} onChange={set} />
      <section className="grid gap-5 xl:grid-cols-3">
        <SensorSection value={form} onChange={set} />
        <LogicSolverSection value={form} onChange={set} />
        <FinalElementSection value={form} onChange={set} />
      </section>
      <SilRiskReductionSection value={form} onChange={set} />
      <ProofTestRequirementSection value={form} onChange={set} />
      <BypassFoundationSection value={form} onChange={set} />
      <DocumentsEvidenceSection value={form} onChange={set} />
      <ReviewSaveSection missing={missing} />
      <div className="sticky bottom-0 flex flex-wrap justify-end gap-2 border-t border-[var(--psm-line)] bg-[var(--psm-bg)] py-4">
        <ActionButton onClick={onCancel}>Cancel</ActionButton>
        <PrimaryButton type="submit" disabled={saving} title="Save is already in progress">{saving ? 'Saving...' : mode === 'create' ? 'Create SIF' : 'Save Changes'}</PrimaryButton>
      </div>
    </form>
  );
}
