export type IncidentDraft = {
  id: string;
  site_id?: string;
  draft_json: Record<string, any>;
  current_step: number;
  last_saved_at: string;
};
