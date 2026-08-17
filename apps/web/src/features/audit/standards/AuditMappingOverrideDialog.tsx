"use client";
import { AuditButton } from "../shared/AuditUi";
import { useAuditMappingMutations } from "../hooks/useAuditMappingMutations";
export function AuditMappingOverrideDialog({ mappingId }: { mappingId: string }) {
  const mutations = useAuditMappingMutations();
  return <AuditButton onClick={() => mutations.save.mutate({ id: mappingId, payload: { manualMapping: true, manualMappingReason: "Manual override requested from UI." } })} disabled={mutations.save.isPending} title="Create/update a manual mapping override reason" variant="secondary">Override Mapping</AuditButton>;
}
