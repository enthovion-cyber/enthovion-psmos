export type LopaStatus = 'Draft' | 'In Preparation' | 'In Progress' | 'Pending Review' | 'Pending Approval' | 'Approved' | 'Closed' | 'Reopened' | 'Cancelled' | 'Overdue' | 'Revalidation Due';

export type LopaSummary = {
  total: number;
  draft: number;
  inPreparation: number;
  inProgress: number;
  pendingReview: number;
  pendingApproval: number;
  approved: number;
  closed: number;
  overdue: number;
  revalidationDue: number;
  createdFromHazop: number;
  manualStudies: number;
  criticalScenarios: number;
  silRequired: number;
  silGapOpen: number;
  openLopaActions: number;
  hazopWaitingForLopa: number;
  calculationIncomplete: number;
  iplValidationIncomplete: number;
  lastUpdated: string;
};

export type LopaStudy = {
  id: string;
  lopaNumber: string;
  title: string;
  studyType: string;
  source: string;
  hazopScenarioId?: string | null;
  siteId?: string | null;
  unitId?: string | null;
  areaId?: string | null;
  equipmentTag?: string | null;
  ownerId?: string | null;
  facilitatorId?: string | null;
  status: LopaStatus | string;
  priority?: string;
  consequenceSeverity?: string | null;
  initiatingEventFrequency?: number | null;
  iplCount: number;
  creditedIplCount: number;
  calculationStatus: string;
  mitigatedEventFrequency?: number | null;
  tolerableFrequency?: number | null;
  riskGap?: string | null;
  silRequired: boolean;
  targetSil?: string | null;
  silGapStatus: string;
  iplValidationStatus: string;
  openActions: number;
  dueDate?: string | null;
  revalidationDueDate?: string | null;
  updatedAt?: string;
};

export type LopaRegisterResponse = { rows: LopaStudy[]; total: number; page: number; limit: number };

export type LopaHazopScenario = {
  id: string;
  hazopId: string;
  hazopNumber: string;
  hazopTitle: string;
  nodeId?: string;
  nodeNumber?: string;
  nodeTitle?: string;
  deviation?: string;
  cause?: string;
  consequence?: string;
  existingSafeguards?: string;
  riskLevel?: string;
  riskScore?: number;
  siteId?: string;
  unitId?: string;
  areaId?: string;
  equipmentTag?: string;
  lopaStatus: string;
  existingLopaId?: string | null;
  existingLopaNumber?: string | null;
  safeguards?: any[];
  recommendations?: any[];
};

export type LopaContext = {
  sites: any[];
  units: any[];
  areas: any[];
  users: any[];
  equipment: any[];
  hazopScenarios: LopaHazopScenario[];
  policies: { allowDuplicateHazopScenario: boolean; facilitatorRequired: boolean; dueDateRequired: boolean; ownerRequired?: boolean; ownerSiteAccessRequired?: boolean };
};

export type LopaOwnerProfile = {
  id: string;
  userId: string;
  profileId?: string | null;
  displayName: string;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
  jobTitle?: string | null;
  department?: string | null;
  discipline?: string | null;
  organization?: string | null;
  companyId?: string | null;
  companyName?: string | null;
  roles?: string[];
  status?: string;
  active?: boolean;
  siteAccess?: Array<{ id: string; name: string; companyId?: string | null; unitId?: string | null; areaId?: string | null }>;
  unitAccess?: Array<{ id: string; name: string; siteId?: string | null }>;
  areaAccess?: Array<{ id: string; name: string; siteId?: string | null; unitId?: string | null }>;
  accessWarning?: string | null;
  validation?: { valid: boolean; errors: string[] };
  suggestionReasons?: string[];
};

export type LopaTeamSuggestion = {
  userId?: string;
  contactId?: string;
  displayName?: string;
  fullName?: string;
  email?: string;
  jobTitle?: string | null;
  department?: string | null;
  organization?: string;
  internalExternal?: string;
  discipline?: string;
  role: string;
  required?: boolean;
  reviewer?: boolean;
  approver?: boolean;
  facilitator?: boolean;
  scribe?: boolean;
  accessLevel?: string;
  suggestionReasons?: string[];
  suggestionSource?: string;
  accessWarning?: string | null;
  invitationMode?: 'add_only' | 'now' | 'after_create';
  invitationRequired?: boolean;
  selected?: boolean;
};

export type LopaTeamSuggestionResponse = {
  rows: LopaTeamSuggestion[];
  missingRoles: string[];
  readiness: 'Complete' | 'Warning' | 'Blocked' | string;
  blockers: Array<{ role: string; message: string }>;
};

export type LopaUserSearchResult = {
  id: string;
  userId: string;
  displayName: string;
  fullName: string;
  email: string;
  jobTitle?: string | null;
  department?: string | null;
  organization?: string;
  internalExternal?: string;
  accessWarning?: string | null;
} & Partial<LopaOwnerProfile>;

export type LopaCreateValues = {
  creationMethod: string;
  title: string;
  description?: string;
  studyType: string;
  source: string;
  hazopScenarioId?: string | undefined;
  companyId?: string | undefined;
  siteId: string;
  unitId?: string | undefined;
  areaId?: string | undefined;
  equipmentTag?: string | undefined;
  equipmentId?: string | undefined;
  ownerId: string;
  facilitatorId?: string | undefined;
  priority?: string | undefined;
  dueDate?: string | undefined;
  revalidationDueDate?: string | undefined;
  confidentialityLevel?: string | undefined;
  tags?: string[] | undefined;
  notes?: string | undefined;
  consequence: {
    description?: string;
    category?: string;
    severity?: string;
    impactedReceptor?: string;
    tolerableEventFrequency?: number | null;
    riskCriteriaSource?: string;
  };
  initiatingEvent: {
    description?: string;
    eventCategory?: string;
    frequencyMethod?: string;
    libraryEvent?: string;
    frequencyPerYear?: number | null;
    frequencySource?: string;
  };
  importedSafeguards: Array<{ sourceSafeguardId?: string; safeguardName: string; safeguardType?: string; description?: string; proposedLopaUse?: string; creditedAsIpl?: boolean; notes?: string }>;
  teamMembers: Array<{ userId?: string; contactId?: string; displayName?: string; fullName?: string; email?: string; role: string; discipline?: string; required?: boolean; organization?: string; internalExternal?: string; jobTitle?: string | null; department?: string | null; responsibility?: string; reviewer?: boolean; approver?: boolean; facilitator?: boolean; scribe?: boolean; accessLevel?: string; invitationRequired?: boolean; invitationMode?: string; invitationMessage?: string; invitationDueDate?: string; suggestionReasons?: string[]; suggestionSource?: string }>;
  sendInvitations?: boolean;
  invitationMessage?: string;
  invitationDueDate?: string;
};

export type LopaAttentionItem = { id: string; itemType: string; studyNumber?: string; title: string; severity?: string; owner?: string; dueDate?: string | null; requiredAction: string; href?: string };
