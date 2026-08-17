export type MiInspectionPlanImportJob = {
  id: string;
  status: string;
  total_rows?: number;
  valid_rows?: number;
  error_rows?: number;
  created_count?: number;
  rows?: Array<Record<string, unknown>>;
};
