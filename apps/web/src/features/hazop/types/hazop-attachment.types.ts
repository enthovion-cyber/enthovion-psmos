export type HazopAttachmentFilters = {
  search?: string;
  category?: string;
  linkedSection?: string;
  reviewStatus?: string;
  visibility?: string;
  fileType?: string;
};

export type HazopAttachment = {
  id: string;
  file_name: string;
  original_file_name?: string;
  file_type?: string;
  mime_type?: string;
  file_size?: number;
  storage_provider?: string;
  storage_key?: string;
  storage_url?: string;
  category?: string;
  description?: string;
  linked_section?: string;
  linked_node_id?: string;
  linked_scenario_id?: string;
  linked_recommendation_id?: string;
  linked_safeguard_id?: string;
  linked_session_id?: string;
  linked_record_id?: string;
  visibility?: string;
  review_required?: boolean;
  review_status?: string;
  version?: number;
  tags?: string[];
  checksum?: string;
  scan_status?: string;
  uploaded_by?: string;
  uploaded_at?: string;
  storage_status?: string;
  uploadedBy?: { displayName?: string; email?: string };
  versions?: HazopAttachmentVersion[];
  accessLogs?: HazopAttachmentAccessLog[];
  history?: any[];
  previewUrl?: string | null;
};

export type HazopAttachmentSummary = {
  totalAttachments: number;
  images: number;
  pdfs: number;
  spreadsheets: number;
  engineeringFiles: number;
  evidenceFiles: number;
  meetingMinutes: number;
  vendorDocuments: number;
  filesNeedingReview: number;
  filesUploadedThisWeek: number;
  largeFiles: number;
  restrictedFiles: number;
};

export type HazopAttachmentVersion = {
  id: string;
  version: number;
  file_name: string;
  storage_key?: string;
  file_size?: number;
  checksum?: string;
  uploaded_by?: string;
  uploaded_at?: string;
  change_reason?: string;
};

export type HazopAttachmentAccessLog = {
  id: string;
  action: string;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  created_at?: string;
};
