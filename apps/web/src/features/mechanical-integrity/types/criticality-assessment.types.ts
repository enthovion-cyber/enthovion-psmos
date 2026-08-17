export type CriticalityAssessmentInput = {
  equipmentId: string;
  assessmentType?: string;
  assessmentReason?: string;
  assessmentDate?: string;
  safetyCritical?: boolean;
  safetyCriticalReason?: string;
  psmCritical?: boolean;
  psmCriticalReason?: string;
  startupBlockerPotential?: boolean;
  notes?: string;
};
