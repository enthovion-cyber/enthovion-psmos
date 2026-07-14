export type HazopHistoryFilters = {
  search?: string;
  category?: string;
  eventType?: string;
  severity?: string;
  actorId?: string;
  dateFrom?: string;
  dateTo?: string;
  safetyCritical?: boolean;
  systemEvents?: boolean;
  userActions?: boolean;
};

export type HazopHistoryEvent = {
  id: string;
  event_type: string;
  event_category?: string;
  event_title?: string;
  event_description?: string;
  title?: string;
  description?: string;
  severity?: string;
  actor_user_id?: string;
  actor_name_snapshot?: string;
  actor?: { displayName?: string; email?: string };
  related_section?: string;
  related_record_id?: string;
  related_record_number?: string;
  before_values_json?: any;
  after_values_json?: any;
  metadata_json?: any;
  safety_critical?: boolean;
  system_generated?: boolean;
  created_at?: string;
};

export type HazopHistorySummary = {
  totalEvents: number;
  eventsToday: number;
  safetyCriticalEvents: number;
  riskChanges: number;
  recommendationEvents: number;
  signoffEvents: number;
  attachmentEvents: number;
  linkedRecordEvents: number;
  workflowEvents: number;
  userActions: number;
  systemActions: number;
};
