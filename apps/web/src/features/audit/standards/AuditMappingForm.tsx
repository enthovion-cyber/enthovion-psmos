"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuditButton, AuditCard, AuditErrorState } from "../shared/AuditUi";
import { useAuditStandardLookups } from "../hooks/useAuditStandardLookups";
import { useAuditMappingMutations } from "../hooks/useAuditMappingMutations";
import { validateAuditMappingForm } from "../schemas/audit-standard-mapping.schema";
import { MappingApplicabilityScopeSection } from "./sections/MappingApplicabilityScopeSection";
import { MappingCoverageHealthSection } from "./sections/MappingCoverageHealthSection";
import { MappingEvidenceSection } from "./sections/MappingEvidenceSection";
import { MappingFindingCapaSection } from "./sections/MappingFindingCapaSection";
import { MappingModuleSection } from "./sections/MappingModuleSection";
import { MappingScoringSection } from "./sections/MappingScoringSection";
import { MappingSourceAuditObjectSection } from "./sections/MappingSourceAuditObjectSection";
import { StandardClauseSelectionSection } from "./sections/StandardClauseSelectionSection";

export function AuditMappingForm({ defaults = {}, id }: { defaults?: Record<string, any>; id?: string }) {
  const router = useRouter();
  const context = useAuditStandardLookups();
  const mutations = useAuditMappingMutations();
  const [errors, setErrors] = useState<string[]>([]);
  async function submit(formData: FormData) {
    const values = Object.fromEntries(Array.from(formData as unknown as Iterable<[string, FormDataEntryValue]>));
    const nextErrors = validateAuditMappingForm(values);
    setErrors(nextErrors);
    if (nextErrors.length) return;
    const saved = await mutations.save.mutateAsync({ ...(id ? { id } : {}), payload: values });
    router.push(`/audit-compliance/standards-mapping/${saved.mapping.id}`);
  }
  if (context.error) return <AuditErrorState message={context.error} onRetry={() => context.refetch()} />;
  return <form action={submit} className="space-y-4">
    {errors.length ? <div className="rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{errors.map((error) => <div key={error}>{error}</div>)}</div> : null}
    <AuditCard title="Standard / Clause Selection" subtitle="Required clause-level mapping from the selected standard."><StandardClauseSelectionSection {...(context.data ? { context: context.data } : {})} defaults={defaults} /></AuditCard>
    <AuditCard title="Source Audit Object" subtitle="Audit program, plan, checklist, execution response, evidence, finding, CAPA, score, or module record source."><MappingSourceAuditObjectSection defaults={defaults} /></AuditCard>
    <AuditCard title="Applicability / Scope" subtitle="Company/site/unit/area/equipment scope and applicability justification."><MappingApplicabilityScopeSection {...(context.data ? { context: context.data } : {})} defaults={defaults} /></AuditCard>
    <AuditCard title="Module Linkage" subtitle="PSM module or integration record mapped to the clause."><MappingModuleSection defaults={defaults} /></AuditCard>
    <AuditCard title="Evidence Mapping" subtitle="Evidence is linked as traceability, not stored in this form."><MappingEvidenceSection defaults={defaults} /></AuditCard>
    <AuditCard title="Finding / CAPA Mapping" subtitle="Findings and CAPA links drive health and blockers."><MappingFindingCapaSection defaults={defaults} /></AuditCard>
    <AuditCard title="Compliance Scoring" subtitle="Phase 8 score runs can be linked for report readiness."><MappingScoringSection defaults={defaults} /></AuditCard>
    <AuditCard title="Coverage Health" subtitle="Coverage and health are backend-generated after save/recalculate."><MappingCoverageHealthSection defaults={defaults} /></AuditCard>
    <div className="flex flex-wrap justify-end gap-2"><AuditButton href="/audit-compliance/standards-mapping/register" variant="secondary">Cancel</AuditButton><AuditButton type="submit" disabled={mutations.save.isPending} title={mutations.save.isPending ? "Saving mapping to backend" : "Save mapping"}>{mutations.save.isPending ? "Saving..." : "Save Mapping"}</AuditButton></div>
  </form>;
}
