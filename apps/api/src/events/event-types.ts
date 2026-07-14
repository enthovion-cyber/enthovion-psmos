export const EventTypes = {
  AuditWritten: 'audit.written',
  UserInvited: 'user.invited',
  DocumentUploaded: 'document.uploaded',
  NotificationQueued: 'notification.queued',
  ActionCreated: 'action.created',
  ActionOverdue: 'action.overdue',
  WorkflowAdvanced: 'workflow.advanced',
  WorkflowStarted: 'workflow.started',
  WorkflowApprovalRequested: 'workflow.approval.requested',
  WorkflowApproved: 'workflow.approved',
  WorkflowRejected: 'workflow.rejected',
  WorkflowOverdue: 'workflow.overdue',
  WorkflowEscalated: 'workflow.escalated',
  EquipmentCreated: 'equipment.created',
  EquipmentDecommissioned: 'equipment.decommissioned'
} as const;
