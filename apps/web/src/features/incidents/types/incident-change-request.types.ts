export type IncidentChangeRequest = {
  id: string;
  request_number?: string;
  requested_by?: string;
  requested_at?: string;
  source_section?: string;
  description: string;
  owner_id?: string;
  due_date?: string;
  status?: string;
  resolution_notes?: string;
  resolved_by?: string;
  resolved_at?: string;
  linked_action_id?: string;
};
