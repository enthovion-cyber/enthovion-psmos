import { useSafeOperatingLimitDetail } from './useSafeOperatingLimitDetail';

export function useLimitCompleteness(limitId: string) {
  const query = useSafeOperatingLimitDetail(limitId);
  return { ...query, data: query.data?.completeness };
}
