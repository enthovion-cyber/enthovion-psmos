export type MiDocumentLink = {
  id: string;
  equipment_id?: string | null;
  linked_module: string;
  linked_record_id: string;
  linked_record_number?: string | null;
  document_id: string;
  document_type: string;
  relationship_type: string;
  purpose?: string | null;
  required: boolean;
  readiness_impact: boolean;
  expiry_required: boolean;
  owner_user_id?: string | null;
  active: boolean;
  linked_by?: string | null;
  linked_at?: string | null;
  document?: Record<string, any> | null;
  document_title?: string | null;
  version?: string | number | null;
  status?: string | null;
  approval_status?: string | null;
  expiry_date?: string | null;
};

export type MiDocumentsResponse = {
  rows: MiDocumentLink[];
  summary?: Record<string, number>;
  requirements?: Record<string, any>;
  savedViews?: string[];
  lastUpdated?: string;
};
