export type IncidentRiskCalculationResult = {
  configured: boolean;
  potentialRiskScore: number | null;
  status: string;
  investigationPriority: string;
  reason?: string;
};
