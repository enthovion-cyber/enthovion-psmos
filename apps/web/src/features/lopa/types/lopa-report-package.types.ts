export type LopaReportPackage = {
  id: string;
  package_number: string;
  package_name: string;
  package_version: number;
  status: string;
  file_size?: number;
  classification?: string;
  manifest_json?: Record<string, unknown>;
  generated_by?: string;
  generated_at?: string;
  items?: any[];
};
