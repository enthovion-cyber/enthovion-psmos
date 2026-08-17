import { useSafeOperatingLimitDetail } from './useSafeOperatingLimitDetail';

export function useLimitConflicts(limitId: string) {
  const query = useSafeOperatingLimitDetail(limitId);
  return { ...query, data: query.data?.conflicts };
}
