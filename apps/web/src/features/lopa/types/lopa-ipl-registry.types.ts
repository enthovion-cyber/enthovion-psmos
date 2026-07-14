export type IplRegistryFilters = {
  q?: string;
  status?: string;
  iplType?: string;
  siteId?: string;
  ownerId?: string;
  validationStatus?: string;
  sourceType?: string;
  quick?: string;
  sort?: string;
  page?: number;
  limit?: number;
};

export type IplRegistryRecord = {
  id: string;
  tenant_id: string;
  company_id?: string | null;
  site_id?: string | null;
  parent_id?: string | null;
  registry_number: string;
  ipl_name: string;
  ipl_type: string;
  description?: string | null;
  service_application?: string | null;
  equipment_type?: string | null;
  process_service?: string | null;
  protected_equipment?: string | null;
  safe_state?: string | null;
  demand_source?: string | null;
  risk_reduction_claim?: string | null;
  pfdavg?: number | null;
  rrf?: number | null;
  pfd_basis?: string | null;
  rrf_basis?: string | null;
  source_type?: string | null;
  source_reference?: string | null;
  standard_reference?: string | null;
  proof_test_interval?: string | null;
  proof_test_basis?: string | null;
  inspection_requirement?: string | null;
  maintenance_requirement?: string | null;
  owner_id?: string | null;
  approval_status: string;
  revision: number;
  revision_notes?: string | null;
  active: boolean;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  review_comment?: string | null;
  review_due_date?: string | null;
  proof_test_due_date?: string | null;
  validation_status: string;
  criteria_template?: Record<string, unknown>;
  type_details?: Record<string, unknown>;
  required_documents?: unknown[];
  tags?: string[];
  usage_count?: number;
  equipment_links_count?: number;
  document_links_count?: number;
  created_by?: string | null;
  updated_by?: string | null;
  created_at: string;
  updated_at: string;
  readOnly?: boolean;
  validationItems?: IplRegistryValidationItem[];
  equipmentLinks?: IplRegistryEquipmentLink[];
  documentLinks?: IplRegistryDocumentLink[];
  history?: IplRegistryHistoryEvent[];
};

export type IplRegistryValidationItem = {
  id?: string;
  criteria_key: string;
  criteria_label: string;
  mandatory: boolean;
  status: string;
  evidence_required: boolean;
  evidence_status: string;
  notes?: string | null;
  sort_order?: number;
};

export type IplRegistryEquipmentLink = {
  id: string;
  equipment_id?: string | null;
  equipment_tag?: string | null;
  equipment_name?: string | null;
  equipment_type?: string | null;
  link_type: string;
  status?: string | null;
  notes?: string | null;
};

export type IplRegistryDocumentLink = {
  id: string;
  document_id?: string | null;
  document_number?: string | null;
  document_title?: string | null;
  document_type?: string | null;
  revision?: string | null;
  status?: string | null;
  effective_date?: string | null;
  link_type: string;
  notes?: string | null;
};

export type IplRegistryHistoryEvent = {
  id: string;
  event_type: string;
  title: string;
  description?: string | null;
  actor_id?: string | null;
  severity: string;
  created_at: string;
};

export type IplRegistryResponse = {
  rows: IplRegistryRecord[];
  total: number;
  page: number;
  limit: number;
};

export type IplRegistrySummary = Record<string, number>;

export type IplRegistryContext = {
  iplTypes: string[];
  approvalStatuses: string[];
  validationStatuses: string[];
  sourceTypes: string[];
  validationTemplate: Array<{ criteriaKey: string; criteriaLabel: string; mandatory: boolean; status: string; evidenceRequired: boolean; evidenceStatus: string; sortOrder: number }>;
  users?: Array<{ id: string; displayName?: string; email?: string; title?: string }>;
  sites?: Array<{ id: string; name: string }>;
  equipment?: Array<{ id: string; tag?: string; name?: string; type?: string; status?: string; criticality?: string }>;
};
