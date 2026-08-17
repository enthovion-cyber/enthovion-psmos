export type MiExportJob = {
  id: string;
  export_number: string;
  export_type: string;
  status: string;
  scope_type: string;
  equipment_id?: string | null;
  output_format: string;
  include_documents: boolean;
  include_history: boolean;
  include_audit: boolean;
  include_linked_records: boolean;
  requested_by: string;
  requested_at: string;
  completed_at?: string | null;
  failed_at?: string | null;
  error_message?: string | null;
  records_count?: number | null;
};

export type MiExportPackage = {
  id: string;
  package_number: string;
  package_type: string;
  title: string;
  description?: string | null;
  equipment_id?: string | null;
  status: string;
  manifest_json?: Record<string, unknown>;
  created_by: string;
  created_at: string;
  completed_at?: string | null;
};

export type MiExportCenter = {
  exportTypes: string[];
  exportFormats: string[];
  jobs: MiExportJob[];
  packages: MiExportPackage[];
  summary: Record<string, number>;
  lastUpdated: string;
};
