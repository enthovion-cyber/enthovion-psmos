export type LopaIplSummary = {
  totalSafeguards: number;
  hazopImported: number;
  safeguardOnly: number;
  iplCandidates: number;
  validationNotStarted: number;
  validationInProgress: number;
  validatedIpls: number;
  creditedIpls: number;
  failedRejected: number;
  missingPfdRrf: number;
  missingProofTest: number;
  commonCauseWarnings: number;
  doubleCountingWarnings: number;
  openGaps: number;
  needsRecalculation: boolean;
};

export type LopaStudySafeguard = {
  id: string;
  safeguard_number?: string;
  safeguard_name: string;
  safeguard_type: string;
  source_type: string;
  proposed_use: string;
  validation_status?: string;
  evidence_status?: string;
  description?: string;
  owner_id?: string;
  notes?: string;
};

export type LopaIplCandidate = {
  id: string;
  candidate_number?: string;
  candidateNumber?: string;
  ipl_name?: string;
  iplName?: string;
  ipl_type?: string;
  iplType?: string;
  source_type?: string;
  sourceType?: string;
  validation_status?: string;
  validationStatus?: string;
  credit_status?: string;
  creditStatus?: string;
  credited_in_calculation?: boolean;
  creditedInCalculation?: boolean;
  pfdavg?: number | null;
  rrf?: number | null;
  source_reference?: string;
  sourceReference?: string;
  proof_test_basis?: string;
  proofTestBasis?: string;
  evidence_status?: string;
  evidenceStatus?: string;
  common_cause_status?: string;
  double_counting_status?: string;
  owner_id?: string;
  notes?: string;
  validationCriteria?: LopaIplValidationCriterion[];
  proofTests?: LopaIplProofTest[];
  creditBlockers?: string[];
};

export type LopaIplValidationCriterion = {
  id?: string;
  criterion_key: string;
  criterion_name: string;
  criterion_category: string;
  required_for_credit: boolean;
  status: string;
  evidence_reference?: string | null;
  notes?: string | null;
};

export type LopaIplProofTest = {
  id?: string;
  proof_test_interval?: string;
  proof_test_procedure_id?: string;
  last_proof_test_date?: string;
  next_proof_test_due?: string;
  maintenance_basis?: string;
  evidence_attachment_id?: string;
  overdue_status?: string;
  notes?: string;
};

export type LopaIplGap = {
  id: string;
  gap_title?: string;
  title?: string;
  gap_type: string;
  severity: string;
  status: string;
  closure_blocker?: boolean;
  generated?: boolean;
};

export type LopaIplsSafeguardsContext = {
  readOnly: boolean;
  safeguardTypes: string[];
  proposedUses: string[];
  validationStatuses: string[];
  creditStatuses: string[];
  registry: Array<Record<string, any>>;
  users: Array<Record<string, any>>;
  equipment: Array<Record<string, any>>;
  documents: Array<Record<string, any>>;
};

export type LopaIplsSafeguardsReadiness = {
  status: string;
  completionPercent: number;
  checklist: Array<{ key: string; label: string; complete: boolean; status: string }>;
  blockers: Array<{ key: string; title: string; severity: string; status: string }>;
  warnings: Array<{ key: string; title: string; severity: string; status: string }>;
};

export type LopaIplsSafeguardsData = {
  readOnly: boolean;
  summary: LopaIplSummary;
  importedHazopSafeguards: LopaStudySafeguard[];
  safeguards: LopaStudySafeguard[];
  candidates: LopaIplCandidate[];
  failedRejected: LopaIplCandidate[];
  creditedIpls: LopaIplCandidate[];
  validationCriteria: LopaIplValidationCriterion[];
  gaps: LopaIplGap[];
  readiness: LopaIplsSafeguardsReadiness;
  context: LopaIplsSafeguardsContext;
};

export type LopaIplsSafeguardsFilters = {
  q?: string | undefined;
  safeguardType?: string | undefined;
  sourceType?: string | undefined;
  proposedUse?: string | undefined;
  validationStatus?: string | undefined;
  creditStatus?: string | undefined;
  ownerId?: string | undefined;
  quick?: string | undefined;
};

export type LopaStudySafeguardInput = {
  safeguardName: string;
  safeguardType: string;
  sourceType?: string | undefined;
  description?: string | undefined;
  proposedUse?: string | undefined;
  ownerId?: string | undefined;
  evidenceStatus?: string | undefined;
  notes?: string | undefined;
};

export type LopaIplCandidateInput = {
  safeguardId?: string | undefined;
  registryIplId?: string | undefined;
  iplName: string;
  iplType: string;
  sourceType?: string | undefined;
  protectionFunction?: string | undefined;
  preventiveOrMitigative?: string | undefined;
  pfdavg?: number | undefined;
  rrf?: number | undefined;
  sourceReference?: string | undefined;
  proofTestBasis?: string | undefined;
  ownerId?: string | undefined;
  notes?: string | undefined;
};
