'use client';

import { usePsiRequirements } from '../hooks/usePsiRequirements';
import { PsiButton, PsiCard, PsiErrorState, PsiLoadingState } from '../shared/PsiUi';

export function PsiRequirementRegistryPage() {
  const requirements = usePsiRequirements();
  if (requirements.isLoading) return <PsiLoadingState rows={5} />;
  if (requirements.isError) return <PsiErrorState message="The completeness requirement registry could not be loaded." onRetry={() => requirements.refetch()} />;
  const rows = requirements.data ?? [];
  return <div className="space-y-5"><PsiCard title="Completeness Requirement Registry" subtitle="Company/site configurable PSI completeness rules, evidence expectations, weighting, blockers, waiver rules, and owner roles." action={<PsiButton href="/process-safety-information/completeness/requirements/new">New Requirement</PsiButton>}><div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="text-left text-xs uppercase text-[var(--psm-muted)]"><tr><th className="py-2">Code</th><th className="py-2">Title</th><th className="py-2">Module</th><th className="py-2">Scope</th><th className="py-2">Severity</th><th className="py-2">PSSR</th><th className="py-2">MOC</th><th className="py-2">Active</th></tr></thead><tbody className="divide-y divide-[var(--psm-line)]">{rows.map((row) => <tr key={row.id}><td className="py-3">{row.requirement_code}</td><td className="py-3 font-medium">{row.requirement_title ?? row.requirement_name}</td><td className="py-3">{row.psi_module}</td><td className="py-3">{row.applicability_scope}</td><td className="py-3">{row.severity_if_missing}</td><td className="py-3">{row.pssr_blocker_if_missing ? 'Yes' : 'No'}</td><td className="py-3">{row.moc_required_if_changed ? 'Yes' : 'No'}</td><td className="py-3">{row.active ? 'Active' : 'Archived'}</td></tr>)}</tbody></table></div></PsiCard></div>;
}
