export type RegulatoryHistoryEvent = {
  id: string;
  created_at: string;
  event_title: string;
  event_type: string;
  event_description?: string | null;
  source_module: string;
  source_record_id?: string | null;
  site_id?: string | null;
  jurisdiction_id?: string | null;
  regulatory_item_id?: string | null;
  obligation_id?: string | null;
  criticality?: string | null;
  restricted?: boolean;
};

export type RegulatoryTrendRun = {
  id: string;
  trend_code: string;
  trend_title: string;
  trend_type: string;
  trend_status: string;
  trend_direction?: string | null;
  trend_confidence?: string | null;
  trend_severity?: string | null;
  stale_status?: string | null;
  stale_reason?: string | null;
  source_record_count: number;
  date_range_start?: string | null;
  date_range_end?: string | null;
  created_at: string;
};

export type RegulatoryRepeatGap = {
  id: string;
  repeat_code?: string | null;
  repeat_title: string;
  repeat_type: string;
  repeat_status: string;
  occurrence_count: number;
  match_confidence?: string | null;
  criticality?: string | null;
  updated_at: string;
};

export type RegulatoryManagementReviewCandidate = {
  id: string;
  candidate_code?: string | null;
  candidate_title: string;
  candidate_type: string;
  candidate_status: string;
  readiness_status: string;
  reason: string;
  criticality?: string | null;
  source_module: string;
  source_record_id: string;
  updated_at: string;
};

export type Paged<T> = { rows: T[]; total: number; page: number; limit: number };
