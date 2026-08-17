import { useAuditFindingDetail } from "./useAuditFindingDetail";

export function useAuditFindingDuplicateCheck(findingId: string) {
  const query = useAuditFindingDetail(findingId);
  return { ...query, data: query.data?.duplicates };
}
