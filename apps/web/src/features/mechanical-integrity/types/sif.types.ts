import type { MiSafeguardDetailResponse, MiSafeguardRegistryResponse, MiSafeguardRow } from './safeguard-common.types';

export type Sif = MiSafeguardRow & {
  sifTag?: string;
  sif_tag?: string;
  sifName?: string;
  sif_name?: string;
  targetSil?: string;
  target_sil?: string;
  architecture?: string;
};

export type SifRegistryResponse = MiSafeguardRegistryResponse<Sif>;
export type SifDetailResponse = MiSafeguardDetailResponse<Sif>;
