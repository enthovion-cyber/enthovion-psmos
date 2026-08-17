import { useAuditFindingDetail } from "./useAuditFindingDetail";

export function useAuditFindingReadiness(findingId: string) {
  const query = useAuditFindingDetail(findingId);
  return { ...query, data: query.data?.readiness };
}
