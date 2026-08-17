import type { MiSafeguardRow } from './safeguard-common.types';

export type SafeguardDemand = MiSafeguardRow & {
  safeguardType?: string;
  safeguard_type?: string;
  demandType?: string;
  demand_type?: string;
  demandResult?: string;
  demand_result?: string;
};
