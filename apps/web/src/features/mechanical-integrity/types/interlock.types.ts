import type { MiSafeguardDetailResponse, MiSafeguardRegistryResponse, MiSafeguardRow } from './safeguard-common.types';

export type Interlock = MiSafeguardRow & {
  interlockTag?: string;
  interlock_tag?: string;
  interlockName?: string;
  interlock_name?: string;
  interlockType?: string;
  interlock_type?: string;
};

export type InterlockRegistryResponse = MiSafeguardRegistryResponse<Interlock>;
export type InterlockDetailResponse = MiSafeguardDetailResponse<Interlock>;
