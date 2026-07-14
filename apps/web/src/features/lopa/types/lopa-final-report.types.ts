export type LopaFinalReportFilters = {
  q?: string;
  reportType?: string;
  status?: string;
  outputFormat?: string;
  templateId?: string;
  official?: string;
  published?: string;
  generatedBy?: string;
  dateFrom?: string;
  dateTo?: string;
  classification?: string;
  failedExports?: string;
  superseded?: string;
  archived?: string;
  documentControlPublished?: string;
  reportPackage?: string;
  sort?: string;
  page?: string;
  limit?: string;
};

export type LopaReportActionInput = {
  reason?: string;
  notes?: string;
};

export type LopaReportGenerateInput = {
  templateId?: string;
  reportType?: string;
  outputFormat?: string;
  official?: boolean;
  draft?: boolean;
  redacted?: boolean;
  includeAppendices?: boolean;
  includeAttachmentsIndex?: boolean;
  includeFullHistory?: boolean;
  includeSignatures?: boolean;
  includeApprovalSnapshot?: boolean;
  includeRestrictedData?: boolean;
  redactionMode?: string;
  watermark?: string;
  fileName?: string;
  classification?: string;
  notes?: string;
  sectionKeys?: string[];
  options?: Record<string, unknown>;
};

export type LopaReportPackageInput = LopaReportGenerateInput & {
  packageName?: string;
  includedFiles?: string[];
  includedAppendices?: string[];
  attachmentIds?: string[];
};

export type LopaReportPublishInput = {
  documentTitle?: string;
  documentNumber?: string;
  documentType?: string;
  classification?: string;
  reason?: string;
  notes?: string;
};

export type LopaReportShareInput = {
  recipientEmail: string;
  recipientUserId?: string;
  recipientRole?: string;
  distributionMethod?: string;
  accessExpiresAt?: string;
  notes?: string;
};

export type LopaFinalReportData = {
  readOnly: boolean;
  header: Record<string, any>;
  summary: Record<string, any>;
  readiness: { status: string; checklist: any[]; blockers: any[]; warnings?: any[]; completionPercent?: number };
  templates: any[];
  sections: any[];
  preview: any;
  register: { rows: any[]; total: number; page: number; limit: number };
  packages: any[];
  appendices: any[];
  redaction: any;
  exportHistory: any[];
  distribution: any[];
  snapshots: any[];
  context: Record<string, any>;
};
