export type IncidentRiskMatrixData = {
  configured: boolean;
  source?: string;
  missingReason?: string | null;
  version?: string | null;
  severities?: string[];
  likelihoods?: string[];
  matrix?: unknown;
  selectedSeverity?: string;
  selectedLikelihood?: string;
  selectedScore?: number | string | null;
  notDetermined?: boolean;
};
