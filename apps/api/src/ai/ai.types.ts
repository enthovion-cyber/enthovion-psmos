export type AiScope = {
  tenantId: string;
  userId: string;
  siteIds: string[];
  corporateView: boolean;
  activeSiteId: string | null;
};

export type AiSource = {
  id: string; // S1, S2...
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
  subtext?: string;
  tone: 'emerald' | 'amber' | 'rose' | 'blue' | 'slate';
};

export type CopilotRecordCard = {
  module: 'PTW' | 'MOC' | 'PSSR' | 'INCIDENT' | 'EQUIPMENT';
  recordId: string;
  recordNumber: string;
  title: string;
  subtitle?: string;
  url: string;
  status: string;
  statusStep?: string;
  riskLevel: string;
  validity?: string;
  workOrChangeType?: string;
  overviewBullets: Array<{ label: string; value: string }>;
  locationDetails: {
    area: string;
    unit?: string;
    equipment?: string;
    holderOrOwner: string;
    holderRole?: string;
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
  structuredCards?: CopilotRecordCard[];
};

export const AI_PROMPT_VERSION = '2026.10-copilot-v2';
export const AI_DISCLAIMER =
  'AI-generated draft for engineering review. It does not approve, authorize, or certify any safety-critical decision.';
