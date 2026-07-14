export type LopaRecommendationFilters = {
  q?: string | undefined;
  status?: string | undefined;
  priority?: string | undefined;
  sourceTab?: string | undefined;
  riskRelevance?: string | undefined;
  blocking?: string | boolean | undefined;
  overdue?: string | boolean | undefined;
  quick?: string | undefined;
};

export type LopaRecommendationInput = {
  title: string;
  description: string;
  sourceType: string;
  sourceTab?: string | undefined;
  sourceRecordId?: string | undefined;
  sourceSnapshot?: Record<string, unknown> | undefined;
  recommendationType?: string | undefined;
  priority: string;
  riskRelevance?: string | undefined;
  blocking?: boolean | undefined;
  ownerId?: string | undefined;
  responsibleDiscipline?: string | undefined;
  dueDate?: string | undefined;
  requiredBeforeReview?: boolean | undefined;
  requiredBeforeStartup?: boolean | undefined;
  requiredBeforeClosure?: boolean | undefined;
  status?: string | undefined;
  verificationRequired?: boolean | undefined;
  notes?: string | undefined;
};

export type LopaRecommendationTabData = {
  readOnly: boolean;
  header: Record<string, any>;
  summary: Record<string, any>;
  sourceFindings: any[];
  recommendations: { rows: any[]; total: number; page: number; limit: number };
  actions: any[];
  readiness: any;
  context: Record<string, any>;
  riskGapActions: any[];
  iplGapActions: any[];
  evidence: any[];
  overdue: any[];
};
