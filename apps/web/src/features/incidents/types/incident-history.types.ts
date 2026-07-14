export type IncidentHistoryEvent = {
  id: string;
  event_number?: number;
  event_type?: string;
  event_category?: string;
  event_title?: string;
  event_description?: string;
  related_tab?: string;
  related_record_type?: string;
  related_record_id?: string;
  actor_user_id?: string;
  actor_role?: string;
  reason?: string;
  before_values_json?: Record<string, any> | null;
  after_values_json?: Record<string, any> | null;
  created_at?: string;
  restricted?: boolean;
};

export type IncidentHistoryData = {
  header: any;
  summaryCards: any[];
  filters: any;
  events: IncidentHistoryEvent[];
  statusTransitions: IncidentHistoryEvent[];
  diff: any;
  reviewApproval: IncidentHistoryEvent[];
  evidence: IncidentHistoryEvent[];
  actions: IncidentHistoryEvent[];
  notifications: IncidentHistoryEvent[];
  access: IncidentHistoryEvent[];
  exportPanel: any;
  context: any;
  permissions: string[];
};
