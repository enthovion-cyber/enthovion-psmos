import { PsiButton } from '../shared/PsiUi';

export function EquipmentDesignHeader({ unitId, lastUpdated }: { unitId?: string | undefined; lastUpdated?: string | undefined }) {
  const newHref = unitId ? `/process-safety-information/units/${unitId}/equipment-design/new` : '/process-safety-information/equipment-design/new';
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">PSI Phase 5</p>
        <h1 className="mt-1 text-3xl font-bold text-[var(--psm-fg)]">Equipment Design Basis</h1>
        <p className="mt-2 max-w-3xl text-sm text-[var(--psm-muted)]">Design ratings, service basis, materials, capacity, codes, assumptions, Document Control links, completeness, conflicts, MI sync, MOC and PSSR readiness.</p>
        {lastUpdated ? <p className="mt-2 text-xs text-[var(--psm-muted)]">Last updated {new Date(lastUpdated).toLocaleString()}</p> : null}
      </div>
      <div className="flex flex-wrap gap-2">
        <PsiButton href={newHref}>Create Design Basis</PsiButton>
        <PsiButton href="/process-safety-information/equipment-design/missing" variant="secondary">Missing</PsiButton>
        <PsiButton href="/process-safety-information/equipment-design/conflicts" variant="secondary">Conflicts</PsiButton>
        <PsiButton href="/process-safety-information/equipment-design/import" variant="secondary">Import</PsiButton>
      </div>
    </div>
  );
}
