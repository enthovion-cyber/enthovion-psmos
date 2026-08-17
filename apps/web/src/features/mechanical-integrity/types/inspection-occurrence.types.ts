export type MiInspectionOccurrence = {
  id: string;
  occurrence_number: string;
  plan_id: string;
  equipment_id: string;
  due_date: string;
  due_basis?: string | null;
  status?: string;
  assigned_user_id?: string | null;
  assigned_team_id?: string | null;
};
