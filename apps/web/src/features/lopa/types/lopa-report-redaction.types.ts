export type LopaReportRedactionPreview = {
  mode: string;
  includeRestrictedData?: boolean;
  restrictedAttachments?: any[];
  restrictedHistory?: any[];
  restrictedLinked?: any[];
  warnings?: string[];
};
