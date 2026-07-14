export type IncidentReadinessCheck = {
  title: string;
  section: string;
  status: 'Complete' | 'Incomplete' | 'Blocked' | string;
  hard?: boolean;
};

export type IncidentReadiness = {
  status: string;
  score: number;
  readyForReview?: boolean;
  checklist: IncidentReadinessCheck[];
  blockers: IncidentReadinessCheck[];
  hardBlockers?: IncidentReadinessCheck[];
  nextRecommendedStep?: string;
  nextSteps?: Array<{ title: string; section: string; severity?: string; action?: string }>;
};
