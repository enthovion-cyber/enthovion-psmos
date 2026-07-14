export type IncidentReviewer = {
  id: string;
  reviewer_user_id?: string;
  reviewer_name?: string;
  reviewer_email?: string;
  role: string;
  department?: string;
  approval_level?: number;
  required?: boolean;
  status?: string;
  decision?: string;
  due_date?: string;
  delegated_to_user_id?: string;
  escalation_status?: string;
  e_signature_required?: boolean;
  e_signature_id?: string;
  comments?: string;
};
