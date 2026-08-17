import { PsiButton } from '../shared/PsiUi';

export function PsiChemicalHeader({ unitId, lastUpdated }: { unitId?: string | undefined; lastUpdated?: string | undefined }) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase text-primary">Process Safety Information</p>
        <h1 className="text-2xl font-bold">{unitId ? 'Unit Chemicals & SDS' : 'Chemicals & SDS'}</h1>
        <p className="mt-2 max-w-3xl text-sm text-[var(--psm-muted)]">Structured chemical use, inventory, SDS status, GHS/NFPA hazards, exposure limits, compatibility, PPE, emergency controls, and completeness impact.</p>
        {lastUpdated ? <p className="mt-1 text-xs text-[var(--psm-muted)]">Last updated {new Date(lastUpdated).toLocaleString()}</p> : null}
      </div>
      <div className="flex flex-wrap gap-2">
        <PsiButton href={unitId ? `/process-safety-information/units/${unitId}/chemicals/new` : '/process-safety-information/chemicals/new'}>Add Chemical</PsiButton>
        <PsiButton href="/process-safety-information/chemicals/missing-sds" variant="secondary">Missing SDS</PsiButton>
        <PsiButton href="/process-safety-information/chemicals/expired-sds" variant="secondary">Expired SDS</PsiButton>
        <PsiButton href="/process-safety-information/chemicals/incompatibilities" variant="secondary">Compatibility</PsiButton>
      </div>
    </div>
  );
}
