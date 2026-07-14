export type LopaTeamMemberInput = {
  userId?: string;
  contactId?: string;
  fullName: string;
  email: string;
  organization?: string;
  internalExternal?: string;
  jobTitle?: string;
  department?: string;
  discipline: string;
  studyRole: string;
  responsibilityDescription?: string;
  requiredParticipant?: boolean;
  votingParticipant?: boolean;
  reviewer?: boolean;
  approver?: boolean;
  facilitator?: boolean;
  scribe?: boolean;
  accessLevel?: string;
  invitationRequired?: boolean;
  notes?: string;
  reason?: string;
};

export type LopaTeamSessionsFilters = {
  q?: string;
  role?: string;
  discipline?: string;
  invitationStatus?: string;
  participationStatus?: string;
  sessionStatus?: string;
  sessionType?: string;
  required?: string;
  quick?: string;
};

export type LopaTeamSessionsTabData = {
  readOnly: boolean;
  header: Record<string, any>;
  summary: Record<string, any>;
  members: { rows: any[]; total: number };
  sessions: { rows: any[]; total: number };
  coverage: any[];
  invitations: any[];
  quorum: any;
  readiness: any;
  actions: any[];
  context: Record<string, any>;
};
