"use client";
import { AuditButton } from "../shared/AuditUi";
import { useAuditMappingMutations } from "../hooks/useAuditMappingMutations";
export function AuditMappingVerifyDialog({ mappingId, disabledReason }: { mappingId: string; disabledReason?: string }) {
  const mutations = useAuditMappingMutations();
  return <AuditButton onClick={() => mutations.transition.mutate({ id: mappingId, action: "verify" })} disabled={Boolean(disabledReason) || mutations.transition.isPending} title={disabledReason ?? "Verify mapping"}>Verify Mapping</AuditButton>;
}
