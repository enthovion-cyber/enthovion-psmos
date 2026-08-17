export type TrainingSummary = Record<string, number>;

export type TrainingDashboardResponse = {
  header: { title: string; subtitle: string; activeSiteId?: string | null; lastUpdated: string };
  summary: TrainingSummary;
  readinessBySite: Array<Record<string, any>>;
  readinessByUnit: Array<Record<string, any>>;
  workforceByEmployerType: Array<{ label: string; count: number }>;
  workforceByDepartment: Array<{ label: string; count: number }>;
  workforceByRole: Array<{ label: string; count: number }>;
  overduePreview: Worker[];
  expiringCertificationsPreview: Worker[];
  safetyCriticalGapsPreview: Worker[];
  ptwAuthorizationGapsPreview: Worker[];
  mocPssrTrainingReadinessPreview: Worker[];
  recentWorkforceChanges: Array<Record<string, any>>;
  recentTrainingHistoryEvents: Array<Record<string, any>>;
  registry: WorkforceResponse;
};

export type WorkforceResponse = {
  rows: Worker[];
  page: number;
  limit: number;
  total: number;
  summary: TrainingSummary;
  savedViews: string[];
  lastUpdated: string;
};

export type Worker = {
  id: string;
  display_name: string;
  first_name?: string | null;
  last_name?: string | null;
  work_email?: string | null;
  employee_id?: string | null;
  contractor_id?: string | null;
  badge_number?: string | null;
  worker_type: string;
  employer_type: string;
  contractor_company_name?: string | null;
  vendor_company_name?: string | null;
  department_name?: string | null;
  department_id?: string | null;
  job_title?: string | null;
  employment_status: string;
  status: string;
  primary_site_id?: string | null;
  training_status: string;
  certification_status: string;
  competency_status: string;
  ptw_authorization_status: string;
  sop_acknowledgement_status?: string | null;
  moc_training_status?: string | null;
  pssr_training_readiness_status?: string | null;
  review_status: string;
  safety_critical_role: boolean;
  linked_user_id?: string | null;
  archived_at?: string | null;
  notes?: string | null;
  primarySite?: { id: string; name: string; code?: string } | null;
  linkedUser?: Record<string, any> | null;
  assignments?: Array<Record<string, any>>;
  roleAssignments?: Array<Record<string, any>>;
  accountLink?: Record<string, any> | null;
};

export type WorkerDetail = {
  worker: Worker;
  header: Record<string, any>;
  summary: Record<string, any>;
  assignments: Array<Record<string, any>>;
  roleAssignments: Array<Record<string, any>>;
  accountLink: Record<string, any> | null;
  documents: Array<Record<string, any>>;
  trainingSummary: Record<string, any>;
  tabs: Array<{ label: string; href: string; enabled: boolean }>;
  history: Array<Record<string, any>>;
  settings: Record<string, any>;
};
