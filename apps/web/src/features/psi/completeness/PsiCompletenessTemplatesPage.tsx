'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { psiCompletenessService } from '../services/psi-completeness.service';
import { PsiButton, PsiCard, PsiErrorState, PsiLoadingState } from '../shared/PsiUi';
import { PsiCompletenessHeader } from './PsiCompletenessHeader';

export function PsiCompletenessTemplatesPage() {
  const client = useQueryClient();
  const templates = useQuery({ queryKey: ['psi', 'completeness', 'templates'], queryFn: () => psiCompletenessService.templates() });
  const apply = useMutation({ mutationFn: () => psiCompletenessService.applyTemplates({}), onSuccess: () => client.invalidateQueries({ queryKey: ['psi', 'completeness', 'requirements'] }) });
  if (templates.isLoading) return <PsiLoadingState rows={4} />;
  if (templates.isError) return <PsiErrorState message="Completeness templates could not be loaded." onRetry={() => templates.refetch()} />;
  return <div className="space-y-5"><PsiCompletenessHeader title="Requirement Templates" subtitle="Default and site-level PSI completeness requirement templates." /><PsiCard title="Templates" action={<PsiButton onClick={() => apply.mutate()} disabled={apply.isPending}>{apply.isPending ? 'Applying...' : 'Apply Default Templates'}</PsiButton>}><div className="grid gap-3 md:grid-cols-2">{(templates.data ?? []).map((template) => <div key={String(template.requirement_code ?? template.id)} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4"><p className="font-semibold">{String(template.requirement_title ?? template.requirement_name ?? 'Requirement template')}</p><p className="mt-1 text-sm text-[var(--psm-muted)]">{String(template.psi_module ?? template.requirement_category ?? '')}</p></div>)}</div></PsiCard></div>;
}
