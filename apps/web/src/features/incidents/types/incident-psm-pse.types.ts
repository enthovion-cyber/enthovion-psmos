export type IncidentPsmPseClassification = {
  isPsmIncident: 'Yes' | 'No' | 'Not Determined';
  isProcessSafetyEvent: 'Yes' | 'No' | 'Not Determined';
  pseTier: string;
  pseClassificationStatus: string;
  thresholdExceeded?: boolean | null;
  reviewerRequired: boolean;
  basis: string;
};
