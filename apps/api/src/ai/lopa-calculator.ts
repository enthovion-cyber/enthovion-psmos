export type LopaInput = {
  initiatingEventFrequencyPerYear?: number | null;
  iplPfds?: Array<number | null | undefined>;
  targetMitigatedFrequencyPerYear?: number | null;
};

export type LopaResult =
  | { status: 'incomplete'; missing: string[]; invalid: string[] }
  | {
      status: 'calculated';
      mitigatedFrequencyPerYear: number;
      requiredRiskReductionFactor: number;
      meetsTarget: boolean;
      requiredAdditionalPfd: number | null;
      method: string;
      version: string;
      inputs: LopaInput;
      validationStatus: 'REQUIRES_SPECIALIST_REVIEW';
    };

export const LOPA_TOOL_VERSION = 'lopa-basic-1.0.0';

/**
 * Deterministic LOPA arithmetic. Never supplies defaults: any missing or out-of-range
 * input yields an `incomplete` result. Independence of IPLs is NOT assessed here.
 */
export function calculateLopa(input: LopaInput): LopaResult {
  const missing: string[] = [];
  const invalid: string[] = [];
  const f = input.initiatingEventFrequencyPerYear;
  const t = input.targetMitigatedFrequencyPerYear;
  if (f == null) missing.push('initiatingEventFrequencyPerYear');
  else if (!Number.isFinite(f) || f <= 0) invalid.push('initiatingEventFrequencyPerYear');
  if (t == null) missing.push('targetMitigatedFrequencyPerYear');
  else if (!Number.isFinite(t) || t <= 0) invalid.push('targetMitigatedFrequencyPerYear');
  const pfds = input.iplPfds ?? [];
  pfds.forEach((p, i) => {
    if (p == null) missing.push(`iplPfds[${i}]`);
    else if (!Number.isFinite(p) || p <= 0 || p > 1) invalid.push(`iplPfds[${i}]`);
  });
  if (missing.length || invalid.length) return { status: 'incomplete', missing, invalid };

  const mitigated = pfds.reduce<number>((acc, p) => acc * (p as number), f as number);
  const rrf = mitigated / (t as number);
  // Relative tolerance avoids float artefacts (e.g. 0.1*0.1*0.01 > 1e-4 by 1 ulp).
  const meets = mitigated <= (t as number) * (1 + 1e-9);
  return {
    status: 'calculated',
    mitigatedFrequencyPerYear: mitigated,
    requiredRiskReductionFactor: rrf,
    meetsTarget: meets,
    requiredAdditionalPfd: meets ? null : (t as number) / mitigated,
    method: 'mitigated = initiating frequency x product(IPL PFD)',
    version: LOPA_TOOL_VERSION,
    inputs: input,
    validationStatus: 'REQUIRES_SPECIALIST_REVIEW'
  };
}

