export type TrainingReportRow = Record<string, any>;

export type TrainingReportList<T = TrainingReportRow> = {
  rows: T[];
  total?: number;
  page?: number;
  limit?: number;
  summary?: Record<string, any>;
};

export type TrainingReportsDashboard = {
  header?: { title?: string; subtitle?: string; lastUpdated?: string };
  summary?: Record<string, any>;
  recentGeneratedReports?: TrainingReportRow[];
  recentExportJobs?: TrainingReportRow[];
  failedExportJobs?: TrainingReportRow[];
  scheduledReportPreview?: TrainingReportRow[];
  mostDownloadedReports?: TrainingReportRow[];
  auditEvidencePackages?: TrainingReportRow[];
  reportsByModule?: Record<string, number>;
  reportsBySite?: Record<string, number>;
  reportsByFormat?: Record<string, number>;
  downloadActivity?: TrainingReportRow[];
  restrictedDataExports?: TrainingReportRow[];
  upcomingScheduledExports?: TrainingReportRow[];
  templatesPreview?: TrainingReportRow[];
  recentHistory?: TrainingReportRow[];
};

export type TrainingReportLookups = {
  trainingReportTypes: string[];
  trainingReportFormats: string[];
  trainingReportStatuses: string[];
  trainingExportJobStatuses: string[];
  trainingPackageTypes: string[];
  trainingConfidentialityLevels: string[];
  trainingScheduledReportFrequencies: string[];
  trainingSourceModules: string[];
};

export type TrainingReportMutationPayload = Record<string, any>;
