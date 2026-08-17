export type MiReportTemplate = {
  id: string;
  template_name: string;
  report_category: string;
  report_type: string;
  description?: string | null;
  output_formats_json?: string[];
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type MiGeneratedReport = {
  id: string;
  report_number: string;
  report_title: string;
  report_category: string;
  report_type: string;
  status: string;
  output_format: string;
  generated_by: string;
  generated_at?: string | null;
  error_message?: string | null;
  created_at: string;
};

export type MiScheduledReport = {
  id: string;
  schedule_name: string;
  report_template_id: string;
  schedule_frequency: string;
  output_format: string;
  active: boolean;
  next_run_at?: string | null;
  last_run_at?: string | null;
};

export type MiReportsDashboard = {
  categories: Array<{ category: string; reports: string[] }>;
  commonReports: string[];
  templates: MiReportTemplate[];
  generated: MiGeneratedReport[];
  scheduled: MiScheduledReport[];
  summary: Record<string, number>;
  lastUpdated: string;
};
