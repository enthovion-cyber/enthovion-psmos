export type LopaReportTemplate = {
  id: string;
  template_name: string;
  template_type: string;
  template_version: string;
  description?: string;
  sections_json?: string[] | unknown[];
  required_sections_json?: string[] | unknown[];
  output_formats_json?: string[] | unknown[];
  active?: boolean;
  default_template?: boolean;
  systemTemplate?: boolean;
};
