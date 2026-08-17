import { useSafeOperatingLimitDetail } from './useSafeOperatingLimitDetail';

export function useLimitValues(limitId: string) {
  const query = useSafeOperatingLimitDetail(limitId);
  return { ...query, data: query.data?.values };
}
