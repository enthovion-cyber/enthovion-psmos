import { get, patch, post, remove } from '@/features/audit/services/audit-api';
import type {
  OpAccessLog,
  OpAcknowledgmentRecord,
  OpAnnualStatement,
  OpApprovalDecision,
  OpApprovalRequest,
  OpAuditPackage,
  OpCertificationCycle,
  OpCertificationReview,
  OpChangeFlag,
  OpChecklistItem,
  OpControlledCopy,
  OpCoverage,
  OpDashboard,
  OpDetail,
  OpExecution,
  OpExecutionDeviation,
  OpExecutionHandover,
  OpExecutionHold,
  OpExecutionStep,
  OpHistoryEvent,
  OpJsa,
  OpJsaRoster,
  OpJsaStep,
  OpLinkedRecord,
  OpLookups,
  OpProcedureAckStats,
  OpPublicationRecord,
  OpRegister,
  OpRevision,
  OpSection,
  OpStep,
  OpStepComment,
  OpStepHazard,
  OpSwpProgram,
  OpTemplate
} from '../types/operating-procedures.types';

const base = '/operating-procedures';

export const operatingProceduresService = {
  dashboard: (params?: Record<string, unknown>) => get<OpDashboard>(`${base}/dashboard`, params),
  register: (params?: Record<string, unknown>) => get<OpRegister>(`${base}/register`, params),
  coverage: (params?: Record<string, unknown>) => get<OpCoverage>(`${base}/coverage`, params),
  lookups: () => get<OpLookups>(`${base}/lookups`),
  detail: (id: string) => get<OpDetail>(`${base}/${id}`),
  create: (data: Record<string, unknown>) => post<OpDetail>(base, data),
  update: (id: string, data: Record<string, unknown>) => patch<OpDetail>(`${base}/${id}`, data),
  archive: (id: string, data: Record<string, unknown>) => post<OpDetail>(`${base}/${id}/archive`, data),
  reactivate: (id: string, data: Record<string, unknown>) => post<OpDetail>(`${base}/${id}/reactivate`, data),
  lock: (id: string, data: Record<string, unknown>) => post<OpDetail>(`${base}/${id}/lock`, data),
  unlock: (id: string, data: Record<string, unknown>) => post<OpDetail>(`${base}/${id}/unlock`, data),
  assignOwner: (id: string, data: Record<string, unknown>) => post<OpDetail>(`${base}/${id}/assign-owner`, data),
  addScope: (id: string, data: Record<string, unknown>) => post(`${base}/${id}/scopes`, data),
  removeScope: (id: string, scopeId: string, data: Record<string, unknown> = {}) => remove(`${base}/${id}/scopes/${scopeId}`, data),
  history: (id: string) => get<OpHistoryEvent[]>(`${base}/${id}/history`),
  accessLog: (id: string) => get<OpAccessLog[]>(`${base}/${id}/access-log`),
  logAccess: (id: string, data: Record<string, unknown>) => post(`${base}/${id}/access-log`, data),
  settings: () => get<Record<string, unknown>>(`${base}/settings`),
  updateSettings: (data: Record<string, unknown>) => patch<Record<string, unknown>>(`${base}/settings`, data),

  // Phase 2 Authoring & Content
  revisions: (procedureId: string) => get<OpRevision[]>(`${base}/${procedureId}/revisions`),
  revision: (procedureId: string, revisionId: string) => get<OpRevision>(`${base}/${procedureId}/revisions/${revisionId}`),
  createRevision: (procedureId: string, data: Record<string, unknown>) => post<OpRevision>(`${base}/${procedureId}/revisions`, data),
  saveSection: (revisionId: string, data: Record<string, unknown>) => post<OpSection>(`${base}/revisions/${revisionId}/sections`, data),
  deleteSection: (sectionId: string) => remove(`${base}/sections/${sectionId}`),
  saveStep: (revisionId: string, data: Record<string, unknown>) => post<OpStep>(`${base}/revisions/${revisionId}/steps`, data),
  deleteStep: (stepId: string) => remove(`${base}/steps/${stepId}`),
  reorderSteps: (revisionId: string, stepIds: string[]) => post(`${base}/revisions/${revisionId}/reorder-steps`, { stepIds }),
  addHazard: (stepId: string, data: Record<string, unknown>) => post<OpStepHazard>(`${base}/steps/${stepId}/hazards`, data),
  removeHazard: (hazardId: string) => remove(`${base}/hazards/${hazardId}`),
  addComment: (revisionId: string, data: Record<string, unknown>) => post<OpStepComment>(`${base}/revisions/${revisionId}/comments`, data),
  resolveComment: (commentId: string) => post<OpStepComment>(`${base}/comments/${commentId}/resolve`),
  templates: (typeCode?: string) => get<OpTemplate[]>(`${base}/templates`, typeCode ? { typeCode } : undefined),

  // Phase 3 Lifecycle Workflow & e-Signatures
  approvalRequests: (procedureId: string) => get<OpApprovalRequest[]>(`${base}/${procedureId}/approval-requests`),
  approvalRequest: (requestId: string) => get<OpApprovalRequest>(`${base}/approval-requests/${requestId}`),
  submitForReview: (procedureId: string, revisionId: string, data: Record<string, unknown>) =>
    post<OpApprovalRequest>(`${base}/${procedureId}/revisions/${revisionId}/submit`, data),
  recordDecision: (requestId: string, stageId: string, data: Record<string, unknown>) =>
    post<OpApprovalRequest>(`${base}/approval-requests/${requestId}/stages/${stageId}/decide`, data),
  publishProcedure: (procedureId: string, revisionId: string, data: Record<string, unknown>) =>
    post<OpDetail>(`${base}/${procedureId}/revisions/${revisionId}/publish`, data),
  pendingReviews: () => get<Record<string, unknown>[]>(`${base}/pending-reviews`),

  // Phase 4 Periodic Certification (OSHA 1910.119(f)(3))
  certificationCycles: (params?: Record<string, unknown>) =>
    get<OpCertificationCycle[]>(`${base}/certification/cycles`, params),
  certificationChecklist: () => get<OpChecklistItem[]>(`${base}/certification/checklist`),
  recordCertificationReview: (cycleId: string, data: Record<string, unknown>) =>
    post<OpCertificationReview>(`${base}/certification/cycles/${cycleId}/review`, data),
  procedureCertification: (procedureId: string) =>
    get<{ procedure: OpDetail; cycles: OpCertificationCycle[]; reviews: OpCertificationReview[] }>(
      `${base}/${procedureId}/certification`
    ),
  annualStatements: (siteId?: string) =>
    get<OpAnnualStatement[]>(`${base}/certification/statements`, siteId ? { siteId } : undefined),
  generateAnnualStatement: (data: { siteId: string; year: number }) =>
    post<OpAnnualStatement>(`${base}/certification/statements/generate`, data),
  signAnnualStatement: (statementId: string, data: Record<string, unknown>) =>
    post<OpAnnualStatement>(`${base}/certification/statements/${statementId}/sign`, data),

  // Phase 5 Execution & Field Checklists
  executions: (params?: Record<string, unknown>) =>
    get<OpExecution[]>(`${base}/executions`, params),
  execution: (executionId: string) =>
    get<OpExecution>(`${base}/executions/${executionId}`),
  procedureExecutions: (procedureId: string, params?: Record<string, unknown>) =>
    get<OpExecution[]>(`${base}/${procedureId}/executions`, params),
  startExecution: (procedureId: string, data: Record<string, unknown>) =>
    post<OpExecution>(`${base}/${procedureId}/executions`, data),
  recordExecutionStep: (executionId: string, stepId: string, data: Record<string, unknown>) =>
    post<{ step: OpExecutionStep; solDeviationLogged: boolean }>(`${base}/executions/${executionId}/steps/${stepId}`, data),
  releaseHold: (executionId: string, holdId: string, data: Record<string, unknown>) =>
    post<OpExecutionHold>(`${base}/executions/${executionId}/holds/${holdId}/release`, data),
  logDeviation: (executionId: string, data: Record<string, unknown>) =>
    post<OpExecutionDeviation>(`${base}/executions/${executionId}/deviations`, data),
  recordHandover: (executionId: string, data: Record<string, unknown>) =>
    post<OpExecutionHandover>(`${base}/executions/${executionId}/handover`, data),
  completeExecution: (executionId: string, data: Record<string, unknown>) =>
    post<OpExecution>(`${base}/executions/${executionId}/complete`, data),
  abortExecution: (executionId: string, data: Record<string, unknown>) =>
    post<OpExecution>(`${base}/executions/${executionId}/abort`, data),

  // Phase 6 Change Flags & MOC/PSI Linking
  changeFlags: (params?: Record<string, unknown>) =>
    get<OpChangeFlag[]>(`${base}/change-flags`, params),
  procedureChangeFlags: (procedureId: string, params?: Record<string, unknown>) =>
    get<OpChangeFlag[]>(`${base}/${procedureId}/change-flags`, params),
  createChangeFlag: (procedureId: string, data: Record<string, unknown>) =>
    post<OpChangeFlag>(`${base}/${procedureId}/change-flags`, data),
  resolveChangeFlag: (flagId: string, data: Record<string, unknown>) =>
    post<OpChangeFlag>(`${base}/change-flags/${flagId}/resolve`, data),
  dismissChangeFlag: (flagId: string, data: Record<string, unknown>) =>
    post<OpChangeFlag>(`${base}/change-flags/${flagId}/dismiss`, data),
  checkMocBlockers: (mocId: string) =>
    get<{ canCloseMoc: boolean; openBlockerCount: number; unresolvedProcedures: any[] }>(`${base}/moc-blockers/${mocId}`),
  linkedRecords: (procedureId: string, type?: string) =>
    get<OpLinkedRecord[]>(`${base}/${procedureId}/linked-records`, type ? { type } : undefined),
  linkRecord: (procedureId: string, data: Record<string, unknown>) =>
    post<OpLinkedRecord>(`${base}/${procedureId}/linked-records`, data),
  unlinkRecord: (linkId: string) =>
    remove(`${base}/linked-records/${linkId}`),

  // Phase 7 Read-and-Understand Acknowledgment
  acknowledgments: (params?: Record<string, unknown>) =>
    get<OpAcknowledgmentRecord[]>(`${base}/acknowledgments`, params),
  procedureAcknowledgments: (procedureId: string, revisionId?: string) =>
    get<OpProcedureAckStats>(`${base}/${procedureId}/acknowledgments`, revisionId ? { revisionId } : undefined),
  signAcknowledgment: (recordId: string, data: Record<string, unknown>) =>
    post<OpAcknowledgmentRecord>(`${base}/acknowledgments/${recordId}/sign`, data),
  checkExecutionGate: (procedureId: string, revisionId: string) =>
    get<{ allowed: boolean; policy: string; acknowledged: boolean; warning?: string; recordId?: string }>(`${base}/${procedureId}/execution-gate/${revisionId}`),

  // Phase 8 Safe Work Practices (SWP) & JSA
  swpPrograms: (params?: Record<string, unknown>) =>
    get<OpSwpProgram[]>(`${base}/swp/programs`, params),
  swpProgram: (programId: string) =>
    get<OpSwpProgram>(`${base}/swp/programs/${programId}`),
  saveSwpProgram: (data: Record<string, unknown>) =>
    post<OpSwpProgram>(`${base}/swp/programs`, data),
  jsas: (params?: Record<string, unknown>) =>
    get<OpJsa[]>(`${base}/jsas`, params),
  jsa: (jsaId: string) =>
    get<OpJsa>(`${base}/jsas/${jsaId}`),
  createJsa: (data: Record<string, unknown>) =>
    post<OpJsa>(`${base}/jsas`, data),
  signJsaRoster: (jsaId: string, data: Record<string, unknown>) =>
    post<OpJsaRoster>(`${base}/jsas/${jsaId}/roster`, data),
  approveJsa: (jsaId: string, data: Record<string, unknown> = {}) =>
    post<OpJsa>(`${base}/jsas/${jsaId}/approve`, data),

  // Phase 9 Reports, Controlled Copies & Audit Packages
  auditPackages: (params?: Record<string, unknown>) =>
    get<OpAuditPackage[]>(`${base}/audit-packages`, params),
  auditPackage: (packageId: string) =>
    get<OpAuditPackage>(`${base}/audit-packages/${packageId}`),
  generateAuditPackage: (data: Record<string, unknown>) =>
    post<OpAuditPackage>(`${base}/audit-packages/generate`, data),
  controlledCopy: (procedureId: string, revisionId?: string) =>
    get<OpControlledCopy>(`${base}/${procedureId}/controlled-copy`, revisionId ? { revisionId } : undefined)
};
