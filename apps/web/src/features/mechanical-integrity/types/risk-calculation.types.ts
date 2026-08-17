export type RiskCalculationResult = {
  consequenceScore?: number | null;
  likelihoodScore?: number | null;
  finalRiskScore?: number | null;
  criticalityCategory?: string | null;
  riskMatrixCell?: string | null;
  explanation?: string | null;
};
