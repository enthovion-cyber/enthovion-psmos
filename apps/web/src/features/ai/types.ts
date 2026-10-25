export type AiSource = {
  id: string;
  recordType: string;
  recordId: string;
  title: string;
  snippet: string;
  url: string | null;
  status: string | null;
};

export type CitationValidation = {
  valid: boolean;
  citedIds: string[];
  unknownCitations: string[];
  uncitedSentences: string[];
};

export type CopilotCardGate = {
  label: string;
  value: string;
  subtext?: string | undefined;
  tone: 'emerald' | 'amber' | 'rose' | 'blue' | 'slate';
};

export type CopilotRecordCard = {
  module: 'PTW' | 'MOC' | 'PSSR' | 'INCIDENT' | 'EQUIPMENT';
  recordId: string;
  recordNumber: string;
  title: string;
  subtitle?: string | undefined;
  url: string;
  status: string;
  statusStep?: string | undefined;
  riskLevel: string;
  validity?: string | undefined;
  workOrChangeType?: string | undefined;
  overviewBullets: Array<{ label: string; value: string }>;
  locationDetails: {
    area: string;
    unit?: string | undefined;
    equipment?: string | undefined;
    holderOrOwner: string;
    holderRole?: string | undefined;
  };
  actionGates: CopilotCardGate[];
  requiredActions: Array<{
    title: string;
    detail: string;
    severity: 'critical' | 'warning' | 'info';
  }>;
};

export type CopilotAnswer = {
  answer: string;
  mode: 'ai' | 'extractive-fallback' | 'no-evidence';
  sources: AiSource[];
  validation: CitationValidation | null;
  uncertainties: string[];
  disclaimer: string;
  structuredCards?: CopilotRecordCard[] | undefined;
};

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  mode?: 'ai' | 'extractive-fallback' | 'no-evidence' | undefined;
  sources?: AiSource[] | undefined;
  uncertainties?: string[] | undefined;
  validation?: CitationValidation | null | undefined;
  structuredCards?: CopilotRecordCard[] | undefined;
  timestamp: string;
  contextModule?: string | undefined;
};

export type AiStatusResponse = {
  aiEnabled: boolean;
  tenantEnabled: boolean;
  systemConfigured: boolean;
  fallback: string;
  model: string | null;
  approvedModels: string[];
  provider: string;
};

export type LopaCalculationRequest = {
  initiatingEventFrequencyPerYear?: number | null | undefined;
  iplPfds?: Array<number | null | undefined> | undefined;
  targetMitigatedFrequencyPerYear?: number | null | undefined;
};

export type LopaCalculationResult =
  | { status: 'incomplete'; missing: string[]; invalid: string[] }
  | {
      status: 'calculated';
      mitigatedFrequencyPerYear: number;
      requiredRiskReductionFactor: number;
      meetsTarget: boolean;
      requiredAdditionalPfd: number | null;
      method: string;
      version: string;
      validationStatus: 'REQUIRES_SPECIALIST_REVIEW';
    };

export type DocumentCompareRequest = {
  docA: { title: string; text: string; revision?: string };
  docB: { title: string; text: string; revision?: string };
};

export type DocumentCompareResponse = {
  summary: string;
  discrepancies: Array<{
    field: string;
    docAValue: string;
    docBValue: string;
    significance: 'CRITICAL_SAFETY' | 'MODERATE' | 'MINOR';
  }>;
  unresolvedQuestions: string[];
};

export type CopilotSession = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  isArchived?: boolean | undefined;
  isPinned?: boolean | undefined;
  messages: ChatMessage[];
  contextModule?: string | undefined;
  siteId?: string | null | undefined;
};

export type CopilotUserPreferences = {
  density: 'comfortable' | 'compact';
  enterToSend: boolean;
  showInlineCitations: boolean;
};

export type CopilotFeedbackInput = {
  messageId: string;
  rating: 'helpful' | 'unhelpful';
  comments?: string | undefined;
};

export type CopilotAttachment = {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadStatus: 'idle' | 'uploading' | 'ready' | 'error';
  errorMessage?: string | undefined;
};
