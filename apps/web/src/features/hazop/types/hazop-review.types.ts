export type HazopReadinessCheck = {
  key: string;
  label: string;
  category: string;
  status: string;
  hard_blocker?: boolean;
  value?: number;
  required_value?: number;
  message?: string;
};

export type HazopReviewReadiness = {
  ready: boolean;
  status: string;
  progress: number;
  nodesCompleted: number;
  scenariosRanked: number;
  highCriticalResolved: boolean;
  recommendationsOpen: number;
  actionsOpen: number;
  lopaPending: number;
  safeguardGapsOpen: number;
  sessionsCompleted: number;
  signoffsPending: number;
  linkedBlockers: number;
  checks: HazopReadinessCheck[];
  blockers: HazopClosureBlocker[];
  warnings: HazopReadinessCheck[];
};

export type HazopClosureBlocker = {
  id?: string;
  blocker_type?: string;
  blocker_key?: string;
  blocker_title: string;
  blocker_description?: string;
  severity?: string;
  status?: string;
};

export type HazopReviewComment = {
  id: string;
  comment_type?: string;
  comment_text: string;
  severity?: string;
  related_section?: string;
  status?: string;
  requires_resolution?: boolean;
  resolution_comment?: string;
  linked_action_id?: string;
  created_at?: string;
  author?: { displayName?: string; email?: string };
};

export type HazopApprovalWorkflow = {
  id?: string;
  workflow_name?: string;
  status?: string;
  current_step?: string;
  started_at?: string;
  requested_at?: string;
  approved_at?: string;
  closed_at?: string;
  reopened_at?: string;
  returned_at?: string;
  rejected_at?: string;
};
