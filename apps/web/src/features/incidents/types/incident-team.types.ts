export type IncidentTeamProfileStatus = 'Active' | 'Pending Invitation' | 'Pending Acceptance' | 'Disabled' | 'External / manual participant' | 'External / Contractor' | string;
export type IncidentTeamAcceptanceStatus = 'Pending Acceptance' | 'Pending' | 'Accepted' | 'Declined' | 'Reassigned' | 'Not Required' | string;
export type IncidentTeamActiveStatus = 'Pending Acceptance' | 'Active' | 'Declined' | 'Removed' | 'Replaced' | 'Disabled' | string;

export interface IncidentTeamMember {
  id?: string;
  user_id?: string;
  display_name?: string;
  email?: string;
  profile_status?: IncidentTeamProfileStatus;
  profile_detection_reason?: string;
  phone?: string;
  team_role?: string;
  discipline?: string;
  department?: string;
  organization?: string;
  company_name?: string;
  contractor_company?: string;
  site_name?: string;
  responsibility?: string;
  required_member?: boolean;
  required_role?: boolean;
  raci_role?: string;
  acceptance_required?: boolean;
  acceptance_status?: IncidentTeamAcceptanceStatus;
  active_status?: IncidentTeamActiveStatus;
  approval_required?: boolean;
  approval_status?: string;
  availability_status?: string;
  conflict_status?: string;
  conflict_declared?: boolean;
  competency_status?: string;
  assigned_by?: string;
  assigned_by_name?: string;
  assigned_at?: string;
  accepted_at?: string;
  declined_at?: string;
  last_notification_sent_at?: string;
  last_reminder_sent_at?: string;
  notes?: string;
}

export interface IncidentRequiredTeamRole {
  id?: string;
  role_name?: string;
  discipline?: string;
  required?: boolean;
  assigned_member_id?: string;
  assigned_member_name?: string;
  status?: string;
  reason?: string;
  source_rule?: string;
  missing?: boolean;
}

export interface IncidentTeamTabData {
  header?: Record<string, any>;
  summaryCards?: Array<Record<string, any>>;
  ownerLead?: Record<string, any>;
  membersRegister?: IncidentTeamMember[];
  requiredRolesMatrix?: IncidentRequiredTeamRole[];
  assignmentAcceptance?: Record<string, any>;
  raci?: Record<string, any>;
  competencyTrainingIndependence?: Record<string, any>;
  availabilityConflictWorkload?: Record<string, any>;
  meetingSessionPlanning?: Record<string, any>;
  communicationNotifications?: Record<string, any>;
  escalationManagementOversight?: Record<string, any>;
  review?: Record<string, any>;
  changeHistory?: Array<Record<string, any>>;
  readiness?: Record<string, any>;
  charts?: Record<string, any>;
  permissions?: Record<string, any>;
  actions?: Array<Record<string, any>>;
  restricted?: boolean;
}
