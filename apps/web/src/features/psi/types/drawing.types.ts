export type Drawing = {
  id: string;
  company_id: string;
  site_id: string;
  unit_id?: string | null;
  area_id?: string | null;
  drawing_number: string;
  drawing_title: string;
  drawing_type: string;
  discipline: string;
  system_service?: string | null;
  drawing_package?: string | null;
  sheet_number?: string | null;
  total_sheets?: number | null;
  drawing_scale?: string | null;
  status: string;
  critical_drawing: boolean;
  psm_critical: boolean;
  completeness_status: string;
  completeness_score?: number | null;
  conflict_status: string;
  review_status: string;
  moc_update_required: boolean;
  pssr_blocker: boolean;
  current_approved: boolean;
  as_built_verified: boolean;
  redline_status?: string | null;
  owner_user_id?: string | null;
  document_controller_id?: string | null;
  process_engineer_id?: string | null;
  discipline_engineer_id?: string | null;
  operations_owner_id?: string | null;
  hse_reviewer_id?: string | null;
  last_review_date?: string | null;
  next_review_due?: string | null;
  notes?: string | null;
  updated_at?: string | null;
  document_status?: string | null;
  document_revision?: string | null;
  as_built_required?: boolean;
  linkedEquipmentCount?: number;
  linkedTagsCount?: number;
  documents?: DrawingDocumentLink[];
  relationships?: DrawingRelationship[];
  mocRedlines?: DrawingMocRedline | null;
};

export type DrawingSummary = {
  totalDrawings: number;
  currentApprovedDrawings: number;
  pids: number;
  pfds: number;
  drawingsMissingCurrentApprovedVersion: number;
  supersededDrawings: number;
  redlinesOpen: number;
  pendingApproval: number;
  asBuiltVerificationRequired: number;
  mocUpdatesRequired: number;
  pssrBlockers: number;
  unitsMissingPid: number;
  unitsMissingPfd: number;
  equipmentMissingDrawingLink: number;
  reliefSystemsMissingPid: number;
  sisInterlocksMissingCauseEffect: number;
  documentsExpiredSuperseded: number;
  reviewOverdue: number;
  lastUpdated: string;
};

export type DrawingRegistry = {
  rows: Drawing[];
  page: number;
  limit: number;
  total: number;
  summary: DrawingSummary;
  savedViews: string[];
  lastUpdated: string;
};

export type DrawingDocumentLink = {
  id: string;
  document_id: string;
  document_version_id?: string | null;
  document_number?: string | null;
  document_title?: string | null;
  revision_number?: string | null;
  revision_date?: string | null;
  document_status?: string | null;
  current_approved: boolean;
  linked_at?: string | null;
  file_type?: string | null;
  revision_notes?: string | null;
};

export type DrawingRelationship = {
  id: string;
  linked_module: string;
  linked_record_id: string;
  linked_record_label?: string | null;
  relationship_type: string;
  readiness_impact: boolean;
  pssr_impact: boolean;
  moc_impact: boolean;
  notes?: string | null;
};

export type DrawingTag = {
  id: string;
  tag_number: string;
  tag_type: string;
  tag_description?: string | null;
  service?: string | null;
  linked_module?: string | null;
  linked_record_id?: string | null;
  sheet_page_reference?: string | null;
  coordinate_reference?: string | null;
  verification_status: string;
  source_method: string;
  mismatch_reason?: string | null;
  notes?: string | null;
};

export type DrawingMocRedline = {
  id: string;
  redline_exists: boolean;
  redline_status?: string | null;
  redline_document_id?: string | null;
  redline_owner_id?: string | null;
  redline_due_date?: string | null;
  moc_required: boolean;
  linked_moc_id?: string | null;
  moc_update_status?: string | null;
  drawing_update_required_by_moc: boolean;
  drawing_update_completed: boolean;
  as_built_required: boolean;
  as_built_verified: boolean;
  as_built_verified_by?: string | null;
  as_built_verified_at?: string | null;
  field_walkdown_required: boolean;
  field_walkdown_status?: string | null;
  field_walkdown_evidence_document_id?: string | null;
  comments?: string | null;
};

export type DrawingCheck = {
  id: string;
  check_key: string;
  check_title: string;
  status: string;
  severity: string;
  message?: string | null;
  pssr_blocker: boolean;
  action_required: boolean;
};

export type DrawingConflict = {
  id: string;
  conflict_type: string;
  conflict_status: string;
  severity: string;
  message: string;
  compared_module?: string | null;
  compared_record_id?: string | null;
  override_required: boolean;
  override_approved: boolean;
  override_reason?: string | null;
};

export type DrawingHistoryEvent = {
  id: string;
  event_type: string;
  event_title: string;
  event_description?: string | null;
  actor_user_id?: string | null;
  created_at: string;
};

export type DrawingDetail = {
  drawing: Drawing;
  unit?: Record<string, unknown> | null;
  documents: DrawingDocumentLink[];
  scope?: Record<string, unknown> | null;
  relationships: DrawingRelationship[];
  tagIndex: DrawingTag[];
  mocRedlines?: DrawingMocRedline | null;
  asBuiltVerifications: Record<string, unknown>[];
  completeness: DrawingCheck[];
  conflicts: DrawingConflict[];
  history: DrawingHistoryEvent[];
  overview: { cards: Array<{ label: string; value: unknown; tone?: 'neutral' | 'good' | 'warn' | 'danger' }>; blockers: Array<Record<string, unknown>> };
  tabs: Array<{ label: string; href: string; enabled: boolean }>;
  actions: Array<{ key: string; label: string; enabled: boolean; disabledReason?: string | null }>;
};

export type DrawingLookups = {
  drawingTypes: string[];
  drawingDisciplines: string[];
  drawingStatuses: string[];
  tagTypes: string[];
  tagVerificationStatuses: string[];
  tagSourceMethods: string[];
  redlineStatuses: string[];
  mocDrawingUpdateStatuses: string[];
  drawingConflictStatuses: string[];
  relationshipTypes: string[];
};
