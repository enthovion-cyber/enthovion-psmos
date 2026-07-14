export type HazopTeamMember = {
  id: string;
  user_id?: string | null;
  name?: string | null;
  display_name?: string | null;
  email?: string | null;
  company_name?: string | null;
  companyOrContractor?: string | null;
  contractorCompanyName?: string | null;
  department_id?: string | null;
  departmentName?: string | null;
  discipline?: string | null;
  role?: string | null;
  study_role?: string | null;
  permission_level?: string | null;
  attendanceRequirement?: string | null;
  required_attendance?: boolean;
  required?: boolean;
  signoff_required?: boolean;
  attendancePercentage?: number;
  lastAttendedSession?: string | { id: string; session_number?: number; title?: string; session_date?: string | null } | null;
  lastAttendedSessionLabel?: string | null;
  openActions?: number;
  signoff_status?: string;
  status?: string;
  notes?: string | null;
};

export type HazopTeamFilters = {
  search?: string;
  discipline?: string;
  studyRole?: string;
  status?: string;
  requiredAttendance?: string;
  signoffRequired?: string;
  attendanceMissing?: string;
  openActions?: string;
};

export type HazopCoverageRow = {
  id: string;
  discipline: string;
  required: boolean;
  coverage_status: string;
  assignedMember?: HazopTeamMember | null;
  missing_reason?: string | null;
  requirement_source?: string | null;
};
