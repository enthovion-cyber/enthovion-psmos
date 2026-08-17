export type PtwAuthorizationRow = Record<string, any>;

export type PtwAuthorizationList = {
  rows: PtwAuthorizationRow[];
  total: number;
  page: number;
  limit: number;
  summary?: Array<{ label: string; count: number }>;
};

export type PtwAuthorizationDashboard = {
  header?: {
    title?: string;
    subtitle?: string;
    activeSiteId?: string | null;
    lastUpdated?: string;
  };
  summary?: Record<string, number>;
  bySite?: Array<Record<string, any>>;
  byUnit?: Array<Record<string, any>>;
  byRole?: Array<Record<string, any>>;
  byPermitType?: Array<Record<string, any>>;
  byWorkerType?: Array<Record<string, any>>;
  expiringPreview?: PtwAuthorizationRow[];
  expiredPreview?: PtwAuthorizationRow[];
  pendingApprovalPreview?: PtwAuthorizationRow[];
  suspendedRevokedPreview?: PtwAuthorizationRow[];
  safetyCriticalGaps?: PtwAuthorizationRow[];
  recentAuthorizationChanges?: PtwAuthorizationRow[];
  recentAuthorizationDenials?: PtwAuthorizationRow[];
  rulesPreview?: PtwAuthorizationRow[];
  authorizationsPreview?: PtwAuthorizationRow[];
  requestsPreview?: PtwAuthorizationRow[];
  gapsPreview?: PtwAuthorizationRow[];
  waiversPreview?: PtwAuthorizationRow[];
};

export type PtwAuthorizationLookups = {
  ptwRoles: string[];
  permitTypes: string[];
  authorizationTypes: string[];
  authorizationStatuses: string[];
  requestStatuses: string[];
  gapTypes: string[];
  gapStatuses: string[];
  waiverStatuses: string[];
  ptwActions: string[];
};
