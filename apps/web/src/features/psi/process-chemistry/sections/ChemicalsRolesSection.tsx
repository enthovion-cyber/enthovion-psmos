import { PsiCard } from '../../shared/PsiUi';

export function ChemicalsRolesSection({ roles }: { roles?: Record<string, any>[] | undefined }) {
  return (
    <PsiCard title="Chemicals & Roles" subtitle="Reactants, products, intermediates, catalysts, inhibitors, solvents, contaminants, quench agents, concentration/feed data, criticality, and hazard contribution.">
      {!roles?.length ? <p className="text-sm text-[var(--psm-muted)]">No chemical roles linked yet. Open the detail record after saving to add controlled chemical role links from the real PSI chemical registry.</p> : <div className="grid gap-3 md:grid-cols-2">{roles.map((role) => <div key={String(role.id)} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><p className="font-semibold">{role.psi_chemicals?.chemical_name ?? role.chemical_id}</p><p className="text-sm text-[var(--psm-muted)]">{role.chemical_role} - {role.normal_concentration ?? 'No concentration'} {role.concentration_unit ?? ''}</p></div>)}</div>}
    </PsiCard>
  );
}
