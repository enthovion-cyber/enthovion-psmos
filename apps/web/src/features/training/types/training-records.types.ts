export type TrainingRecordSummary = Record<string, number>;

export type TrainingSession = Record<string, any> & {
  id: string;
  session_title: string;
  session_code?: string | null;
  session_type?: string | null;
  session_status?: string | null;
  approval_status?: string | null;
  training_item_id?: string | null;
  training_item_version?: string | null;
  training_category?: string | null;
  site_id?: string | null;
  unit_id?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  instructor_user_id?: string | null;
  instructor_worker_id?: string | null;
  external_instructor_name?: string | null;
  rosterCount?: number;
  present?: number;
  absent?: number;
  completed?: number;
  pendingVerification?: number;
  missingEvidence?: number;
};

export type TrainingCompletionRecord = Record<string, any> & {
  id: string;
  worker_id: string;
  session_id?: string | null;
  training_item_id?: string | null;
  training_item_version?: string | null;
  training_code?: string | null;
  training_title?: string | null;
  training_category?: string | null;
  completion_status?: string | null;
  attendance_status?: string | null;
  evidence_status?: string | null;
  verification_status?: string | null;
  approval_status?: string | null;
  completion_date?: string | null;
  expiry_date?: string | null;
};

export type TrainingRecordsRegistry<T> = {
  rows: T[];
  allRows?: T[];
  page: number;
  limit: number;
  total: number;
  summary?: Record<string, any>;
  savedViews?: string[];
  lastUpdated?: string;
};

export type TrainingRecordsDashboardResponse = {
  header?: Record<string, any>;
  summary: TrainingRecordSummary;
  attendanceBySite?: Array<{ label: string; count: number }>;
  attendanceByUnit?: Array<{ label: string; count: number }>;
  completionByCategory?: Array<{ label: string; count: number }>;
  pendingVerificationPreview?: TrainingCompletionRecord[];
  missingEvidencePreview?: TrainingCompletionRecord[];
  failedIncompletePreview?: TrainingCompletionRecord[];
  sessionsRequiringAttendance?: TrainingSession[];
  recentCompletedSessions?: TrainingSession[];
  recentManualCorrections?: Record<string, any>[];
  recordsAffectingBlockers?: TrainingCompletionRecord[];
  matrixGapsResolvedByRecord?: TrainingCompletionRecord[];
  sessions?: TrainingRecordsRegistry<TrainingSession>;
  records?: TrainingRecordsRegistry<TrainingCompletionRecord>;
  settings?: Record<string, any>;
};

export type TrainingSessionDetailResponse = {
  session: TrainingSession;
  header?: Record<string, any>;
  summary?: Record<string, any>;
  roster: TrainingRosterEntry[];
  attendance: TrainingAttendanceRecord[];
  completionRecords: TrainingCompletionRecord[];
  evidence: Record<string, any>[];
  links: Record<string, any>[];
  readiness?: { status: string; blockers: Array<{ code: string; message: string }> };
  tabs?: Array<{ label: string; href: string; enabled: boolean }>;
  history?: Record<string, any>[];
  settings?: Record<string, any>;
};

export type TrainingRecordDetailResponse = {
  record: TrainingCompletionRecord;
  header?: Record<string, any>;
  evidence: Record<string, any>[];
  links: Record<string, any>[];
  verifications: Record<string, any>[];
  readiness?: { status: string; blockers: Array<{ code: string; message: string }> };
  history?: Record<string, any>[];
};

export type TrainingRosterEntry = Record<string, any> & {
  id: string;
  session_id: string;
  worker_id: string;
  roster_status?: string | null;
  workerName?: string;
  worker?: Record<string, any> | null;
};

export type TrainingAttendanceRecord = Record<string, any> & {
  id: string;
  session_id: string;
  worker_id: string;
  attendance_status?: string | null;
  attendance_locked?: boolean;
  workerName?: string;
  worker?: Record<string, any> | null;
};

export type TrainingRecordsContext = {
  sites: Record<string, any>[];
  units: Record<string, any>[];
  areas: Record<string, any>[];
  workers: Record<string, any>[];
  users: Record<string, any>[];
  requiredTraining: Record<string, any>[];
  documents: Record<string, any>[];
  settings: Record<string, any>;
  lookups: Record<string, string[]>;
};
