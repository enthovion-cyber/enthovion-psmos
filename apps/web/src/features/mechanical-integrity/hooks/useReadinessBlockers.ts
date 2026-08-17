import { useReadinessDetail } from './useReadinessDetail';

export function useReadinessBlockers(id?: string) {
  const query = useReadinessDetail(id);
  return { ...query, data: query.data?.blockers ?? [] };
}
