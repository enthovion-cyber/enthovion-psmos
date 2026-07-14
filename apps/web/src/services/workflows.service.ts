import { api } from './api';

export type WorkflowStepInput = {
  id?: string | undefined;
  stepName: string;
  stepType?: string | undefined;
  sequence: number;
  assignedRoleId?: string | undefined;
  assignedUserId?: string | undefined;
  assignedDepartmentId?: string | undefined;
  approvalMode?: string | undefined;
  parallelGroup?: string | undefined;
  conditionRule?: Record<string, unknown> | undefined;
  slaHours?: number | undefined;
  isRequired?: boolean | undefined;
  canReject?: boolean | undefined;
  canOverride?: boolean | undefined;
};

export type WorkflowTemplateInput = {
  module: string;
  name: string;
  description?: string | undefined;
  companyId?: string | undefined;
  siteId?: string | undefined;
  status?: string | undefined;
  isDefault?: boolean | undefined;
  steps: WorkflowStepInput[];
};

export type WorkflowTemplate = {
  id: string;
  tenant_id: string;
  company_id?: string | null;
  site_id?: string | null;
  module: string;
  name: string;
  description?: string | null;
  status: string;
  is_default: boolean;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  steps: WorkflowTemplateStep[];
};

export type WorkflowTemplateStep = {
  id: string;
  template_id: string;
  step_name: string;
  step_type: string;
  sequence: number;
  assigned_role_id?: string | null;
  assigned_user_id?: string | null;
  assigned_department_id?: string | null;
  approval_mode: string;
  parallel_group?: string | null;
  condition_rule?: Record<string, unknown> | null;
  sla_hours?: number | null;
  is_required: boolean;
  can_reject: boolean;
  can_override: boolean;
};

export type WorkflowInstance = {
  id: string;
  template_id?: string | null;
  tenant_id: string;
  company_id?: string | null;
  site_id?: string | null;
  module: string;
  record_id: string;
  record_number: string;
  context_data: Record<string, unknown>;
  status: string;
  started_by?: string | null;
  started_at: string;
  completed_at?: string | null;
  updated_at: string;
  steps: WorkflowInstanceStep[];
  approvals: WorkflowApproval[];
  comments: WorkflowComment[];
  history: WorkflowHistoryItem[];
  escalations: WorkflowEscalation[];
};

export type WorkflowInstanceStep = {
  id: string;
  workflow_instance_id: string;
  step_name: string;
  step_type: string;
  sequence: number;
  assigned_to_user_id?: string | null;
  assigned_to_role_id?: string | null;
  assigned_to_department_id?: string | null;
  approval_mode: string;
  parallel_group?: string | null;
  is_required: boolean;
  can_reject: boolean;
  can_override: boolean;
  status: string;
  due_at?: string | null;
  completed_by?: string | null;
  completed_at?: string | null;
  comments?: string | null;
};

export type WorkflowApproval = { id: string; workflow_step_id: string; approver_id: string; decision: string; comment?: string | null; created_at: string };
export type WorkflowComment = { id: string; workflow_step_id?: string | null; author_id?: string | null; body: string; created_at: string };
export type WorkflowHistoryItem = { id: string; event_type: string; description: string; user_id?: string | null; created_at: string };
export type WorkflowEscalation = { id: string; workflow_step_id: string; escalated_to?: string | null; escalation_level: number; reason: string; escalated_at: string };

export type StartWorkflowInput = {
  module: string;
  recordId: string;
  recordNumber: string;
  siteId: string;
  companyId?: string | undefined;
  workflowTemplateId?: string | undefined;
  contextData?: Record<string, unknown> | undefined;
};

function data<T>(response: { data: T }) {
  return response.data;
}

export const workflowsService = {
  listTemplates: (module?: string) => api.get<WorkflowTemplate[]>('/workflows/templates', { params: module ? { module } : undefined }).then(data),
  getTemplate: (id: string) => api.get<WorkflowTemplate>(`/workflows/templates/${id}`).then(data),
  createTemplate: (input: WorkflowTemplateInput) => api.post<WorkflowTemplate>('/workflows/templates', input).then(data),
  updateTemplate: (id: string, input: Partial<WorkflowTemplateInput>) => api.patch<WorkflowTemplate>(`/workflows/templates/${id}`, input).then(data),
  deleteTemplate: (id: string) => api.delete<{ deleted: boolean }>(`/workflows/templates/${id}`).then(data),
  cloneTemplate: (id: string) => api.post<WorkflowTemplate>(`/workflows/templates/${id}/clone`).then(data),
  activateTemplate: (id: string) => api.post<WorkflowTemplate>(`/workflows/templates/${id}/activate`).then(data),
  deactivateTemplate: (id: string) => api.post<WorkflowTemplate>(`/workflows/templates/${id}/deactivate`).then(data),
  setDefault: (id: string) => api.post<WorkflowTemplate>(`/workflows/templates/${id}/set-default`).then(data),
  start: (input: StartWorkflowInput) => api.post<WorkflowInstance>('/workflows/start', input).then(data),
  getInstance: (id: string) => api.get<WorkflowInstance>(`/workflows/${id}`).then(data),
  history: (id: string) => api.get<WorkflowHistoryItem[]>(`/workflows/${id}/history`).then(data),
  approve: (id: string, input: { stepId?: string; comment?: string }) => api.post<WorkflowInstance>(`/workflows/${id}/approve`, input).then(data),
  reject: (id: string, input: { stepId?: string; comment: string }) => api.post<WorkflowInstance>(`/workflows/${id}/reject`, input).then(data),
  returnForRevision: (id: string, input: { stepId?: string; comment: string }) => api.post<WorkflowInstance>(`/workflows/${id}/return`, input).then(data),
  override: (id: string, reason: string) => api.post<WorkflowInstance>(`/workflows/${id}/override`, { reason }).then(data),
  forRecord: (module: string, recordId: string) => api.get<WorkflowInstance[]>(`/workflows/record/${module}/${recordId}`).then(data),
  overdue: () => api.get<WorkflowInstanceStep[]>('/workflows/overdue').then(data),
  escalate: (id: string) => api.post<WorkflowEscalation[]>(`/workflows/${id}/escalate`).then(data)
};
