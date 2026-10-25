export const opProcedureStatuses = ['Draft', 'In Review', 'Review Complete', 'Pending Approval', 'Approved', 'Published', 'Under Revision', 'Superseded', 'Withdrawn', 'Rejected', 'Archived'] as const;
export const opCertificationStatuses = ['Not Due', 'Upcoming', 'Due', 'Overdue', 'Certified', 'Certified With Changes', 'Expired'] as const;
export const opCriticalityLevels = ['High', 'Medium', 'Low'] as const;
export const opOperatingModes = ['Startup', 'Normal', 'Temporary', 'Emergency Shutdown', 'Emergency Operation', 'Normal Shutdown', 'Startup After Turnaround', 'Maintenance', 'Any'] as const;
export const opScopeTypes = ['Site', 'Area', 'Unit', 'Equipment', 'Operating Mode', 'Shift', 'Role', 'Crew', 'Chemical', 'Process System'] as const;
export const opAccessTypes = ['View', 'Print', 'Download', 'Export', 'Execute'] as const;

/** Statuses where content/metadata edits are blocked (a new revision is required). */
export const opReadOnlyStatuses = new Set(['Published', 'Superseded', 'Archived', 'Withdrawn', 'Pending Approval', 'Approved']);

/** Updatable header fields (camelCase DTO -> snake_case column). */
export const opEditableFields: Record<string, string> = {
  title: 'title',
  purpose: 'purpose',
  scopeSummary: 'scope_summary',
  siteId: 'site_id',
  departmentId: 'department_id',
  areaId: 'area_id',
  unitId: 'unit_id',
  equipmentId: 'equipment_id',
  categoryId: 'category_id',
  operatingMode: 'operating_mode',
  criticality: 'criticality',
  isPsmCovered: 'is_psm_covered',
  isTemplate: 'is_template',
  isTemporary: 'is_temporary',
  temporaryExpiresAt: 'temporary_expires_at',
  ownerUserId: 'owner_user_id',
  smeUserIds: 'sme_user_ids',
  approverUserId: 'approver_user_id',
  reviewFrequencyMonths: 'review_frequency_months',
  language: 'language',
  regulatoryBasis: 'regulatory_basis',
  tags: 'tags',
  notes: 'notes'
};

/** Days before due date when certification becomes "Upcoming". */
export const OP_UPCOMING_WINDOW_DAYS = 60;
