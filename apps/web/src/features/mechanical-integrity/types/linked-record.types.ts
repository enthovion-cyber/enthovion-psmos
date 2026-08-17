export type MiLinkedRecord = {
  id: string;
  equipment_id?: string | null;
  source_module: string;
  source_record_id: string;
  source_record_number?: string | null;
  target_module: string;
  target_record_id: string;
  target_record_number?: string | null;
  relationship_type: string;
  relationship_description?: string | null;
  readiness_impact: boolean;
  primary_link: boolean;
  permission_limited?: boolean;
  broken_link?: boolean;
  active: boolean;
  created_by?: string | null;
  created_at?: string | null;
};

export type MiLinkedRecordsResponse = {
  rows: MiLinkedRecord[];
  page?: number;
  limit?: number;
  total?: number;
  summary?: Record<string, number>;
  savedViews?: string[];
  lastUpdated?: string;
};
