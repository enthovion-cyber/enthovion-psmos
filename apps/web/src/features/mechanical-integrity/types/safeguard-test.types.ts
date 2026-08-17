import type { MiSafeguardDetailResponse, MiSafeguardRegistryResponse, MiSafeguardRow } from './safeguard-common.types';

export type SafeguardTest = MiSafeguardRow & {
  testNumber?: string;
  test_number?: string;
  safeguardType?: string;
  safeguard_type?: string;
  finalResult?: string;
  final_result?: string;
};

export type SafeguardTestRegistryResponse = MiSafeguardRegistryResponse<SafeguardTest>;
export type SafeguardTestDetailResponse = MiSafeguardDetailResponse<SafeguardTest>;
