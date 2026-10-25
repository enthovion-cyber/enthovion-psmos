import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { operatingProceduresService as svc } from '../services/operating-procedures.service';
import type { OpDetail } from '../types/operating-procedures.types';

const KEY = 'operating-procedures';

export function useOpDashboard(filters?: Record<string, unknown>) {
  return useQuery({ queryKey: [KEY, 'dashboard', filters], queryFn: () => svc.dashboard(filters), refetchOnWindowFocus: false });
}

export function useOpRegister(filters?: Record<string, unknown>) {
  return useQuery({ queryKey: [KEY, 'register', filters], queryFn: () => svc.register(filters), refetchOnWindowFocus: false });
}

export function useOpLookups() {
  return useQuery({ queryKey: [KEY, 'lookups'], queryFn: () => svc.lookups(), staleTime: 5 * 60_000 });
}

export function useOpProcedure(id?: string) {
  return useQuery({ queryKey: [KEY, 'detail', id], queryFn: () => svc.detail(String(id)), enabled: Boolean(id), refetchOnWindowFocus: false });
}

export function useOpHistory(id?: string, enabled = true) {
  return useQuery({ queryKey: [KEY, 'history', id], queryFn: () => svc.history(String(id)), enabled: Boolean(id) && enabled });
}

export function useOpAccessLog(id?: string, enabled = true) {
  return useQuery({ queryKey: [KEY, 'access-log', id], queryFn: () => svc.accessLog(String(id)), enabled: Boolean(id) && enabled });
}

export function useOpSettings() {
  return useQuery({ queryKey: [KEY, 'settings'], queryFn: () => svc.settings() });
}

// Phase 2 Authoring Hooks
export function useOpRevisions(procedureId?: string, enabled = true) {
  return useQuery({
    queryKey: [KEY, 'revisions', procedureId],
    queryFn: () => svc.revisions(String(procedureId)),
    enabled: Boolean(procedureId) && enabled,
    refetchOnWindowFocus: false
  });
}

export function useOpRevision(procedureId?: string, revisionId?: string) {
  return useQuery({
    queryKey: [KEY, 'revision', procedureId, revisionId],
    queryFn: () => svc.revision(String(procedureId), String(revisionId)),
    enabled: Boolean(procedureId) && Boolean(revisionId),
    refetchOnWindowFocus: false
  });
}

export function useOpAuthoringMutations(procedureId?: string, revisionId?: string) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: [KEY, 'revisions', procedureId] });
    qc.invalidateQueries({ queryKey: [KEY, 'revision', procedureId, revisionId] });
    qc.invalidateQueries({ queryKey: [KEY, 'detail', procedureId] });
  };
  const pid = String(procedureId);
  const rid = String(revisionId);

  return {
    createRevision: useMutation({
      mutationFn: (data: Record<string, unknown>) => svc.createRevision(pid, data),
      onSuccess: invalidate
    }),
    saveSection: useMutation({
      mutationFn: (data: Record<string, unknown>) => svc.saveSection(rid, data),
      onSuccess: invalidate
    }),
    deleteSection: useMutation({
      mutationFn: (sectionId: string) => svc.deleteSection(sectionId),
      onSuccess: invalidate
    }),
    saveStep: useMutation({
      mutationFn: (data: Record<string, unknown>) => svc.saveStep(rid, data),
      onSuccess: invalidate
    }),
    deleteStep: useMutation({
      mutationFn: (stepId: string) => svc.deleteStep(stepId),
      onSuccess: invalidate
    }),
    reorderSteps: useMutation({
      mutationFn: (stepIds: string[]) => svc.reorderSteps(rid, stepIds),
      onSuccess: invalidate
    }),
    addHazard: useMutation({
      mutationFn: ({ stepId, data }: { stepId: string; data: Record<string, unknown> }) => svc.addHazard(stepId, data),
      onSuccess: invalidate
    }),
    removeHazard: useMutation({
      mutationFn: (hazardId: string) => svc.removeHazard(hazardId),
      onSuccess: invalidate
    }),
    addComment: useMutation({
      mutationFn: (data: Record<string, unknown>) => svc.addComment(rid, data),
      onSuccess: invalidate
    }),
    resolveComment: useMutation({
      mutationFn: (commentId: string) => svc.resolveComment(commentId),
      onSuccess: invalidate
    })
  };
}

// Phase 3 Lifecycle Hooks
export function useOpApprovalRequests(procedureId?: string, enabled = true) {
  return useQuery({
    queryKey: [KEY, 'approval-requests', procedureId],
    queryFn: () => svc.approvalRequests(String(procedureId)),
    enabled: Boolean(procedureId) && enabled,
    refetchOnWindowFocus: false
  });
}

export function useOpApprovalRequest(requestId?: string) {
  return useQuery({
    queryKey: [KEY, 'approval-request', requestId],
    queryFn: () => svc.approvalRequest(String(requestId)),
    enabled: Boolean(requestId),
    refetchOnWindowFocus: false
  });
}

export function useOpPendingReviews() {
  return useQuery({
    queryKey: [KEY, 'pending-reviews'],
    queryFn: () => svc.pendingReviews(),
    refetchOnWindowFocus: false
  });
}

export function useOpLifecycleMutations(procedureId?: string) {
  const qc = useQueryClient();
  const pid = String(procedureId);
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: [KEY, 'approval-requests', pid] });
    qc.invalidateQueries({ queryKey: [KEY, 'detail', pid] });
    qc.invalidateQueries({ queryKey: [KEY, 'revisions', pid] });
    qc.invalidateQueries({ queryKey: [KEY, 'register'] });
    qc.invalidateQueries({ queryKey: [KEY, 'dashboard'] });
  };

  return {
    submitForReview: useMutation({
      mutationFn: ({ revisionId, data }: { revisionId: string; data: Record<string, unknown> }) =>
        svc.submitForReview(pid, revisionId, data),
      onSuccess: invalidate
    }),
    recordDecision: useMutation({
      mutationFn: ({ requestId, stageId, data }: { requestId: string; stageId: string; data: Record<string, unknown> }) =>
        svc.recordDecision(requestId, stageId, data),
      onSuccess: invalidate
    }),
    publishProcedure: useMutation({
      mutationFn: ({ revisionId, data }: { revisionId: string; data: Record<string, unknown> }) =>
        svc.publishProcedure(pid, revisionId, data),
      onSuccess: invalidate
    })
  };
}

// Phase 4 Certification Hooks (OSHA 1910.119(f)(3))
export function useOpCertificationCycles(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: [KEY, 'certification-cycles', filters],
    queryFn: () => svc.certificationCycles(filters),
    refetchOnWindowFocus: false
  });
}

export function useOpCertificationChecklist() {
  return useQuery({
    queryKey: [KEY, 'certification-checklist'],
    queryFn: () => svc.certificationChecklist(),
    staleTime: 10 * 60_000
  });
}

export function useOpProcedureCertification(procedureId?: string, enabled = true) {
  return useQuery({
    queryKey: [KEY, 'procedure-certification', procedureId],
    queryFn: () => svc.procedureCertification(String(procedureId)),
    enabled: Boolean(procedureId) && enabled,
    refetchOnWindowFocus: false
  });
}

export function useOpAnnualStatements(siteId?: string) {
  return useQuery({
    queryKey: [KEY, 'annual-statements', siteId],
    queryFn: () => svc.annualStatements(siteId),
    refetchOnWindowFocus: false
  });
}

export function useOpCertificationMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: [KEY, 'certification-cycles'] });
    qc.invalidateQueries({ queryKey: [KEY, 'procedure-certification'] });
    qc.invalidateQueries({ queryKey: [KEY, 'annual-statements'] });
    qc.invalidateQueries({ queryKey: [KEY, 'register'] });
    qc.invalidateQueries({ queryKey: [KEY, 'dashboard'] });
  };

  return {
    recordReview: useMutation({
      mutationFn: ({ cycleId, data }: { cycleId: string; data: Record<string, unknown> }) =>
        svc.recordCertificationReview(cycleId, data),
      onSuccess: invalidate
    }),
    generateStatement: useMutation({
      mutationFn: (data: { siteId: string; year: number }) => svc.generateAnnualStatement(data),
      onSuccess: invalidate
    }),
    signStatement: useMutation({
      mutationFn: ({ statementId, data }: { statementId: string; data: Record<string, unknown> }) =>
        svc.signAnnualStatement(statementId, data),
      onSuccess: invalidate
    })
  };
}

export function useOpMutations(id?: string) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: [KEY] });
  const pid = String(id);
  return {
    create: useMutation<OpDetail, Error, Record<string, unknown>>({ mutationFn: (d) => svc.create(d), onSuccess: invalidate }),
    update: useMutation<OpDetail, Error, Record<string, unknown>>({ mutationFn: (d) => svc.update(pid, d), onSuccess: invalidate }),
    archive: useMutation<OpDetail, Error, Record<string, unknown>>({ mutationFn: (d) => svc.archive(pid, d), onSuccess: invalidate }),
    reactivate: useMutation<OpDetail, Error, Record<string, unknown>>({ mutationFn: (d) => svc.reactivate(pid, d), onSuccess: invalidate }),
    lock: useMutation<OpDetail, Error, Record<string, unknown>>({ mutationFn: (d) => svc.lock(pid, d), onSuccess: invalidate }),
    unlock: useMutation<OpDetail, Error, Record<string, unknown>>({ mutationFn: (d) => svc.unlock(pid, d), onSuccess: invalidate }),
    assignOwner: useMutation<OpDetail, Error, Record<string, unknown>>({ mutationFn: (d) => svc.assignOwner(pid, d), onSuccess: invalidate }),
    addScope: useMutation<unknown, Error, Record<string, unknown>>({ mutationFn: (d) => svc.addScope(pid, d), onSuccess: invalidate }),
    removeScope: useMutation<unknown, Error, { scopeId: string; reason?: string }>({ mutationFn: ({ scopeId, reason }) => svc.removeScope(pid, scopeId, reason ? { reason } : {}), onSuccess: invalidate }),
    updateSettings: useMutation<Record<string, unknown>, Error, Record<string, unknown>>({ mutationFn: (d) => svc.updateSettings(d), onSuccess: invalidate })
  };
}

// Phase 5 Execution & Field Checklists Hooks
export function useOpExecutions(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: [KEY, 'executions', filters],
    queryFn: () => svc.executions(filters),
    refetchOnWindowFocus: false
  });
}

export function useOpExecution(executionId?: string, enabled = true) {
  return useQuery({
    queryKey: [KEY, 'execution-detail', executionId],
    queryFn: () => svc.execution(String(executionId)),
    enabled: Boolean(executionId) && enabled,
    refetchInterval: 10_000, // Real-time poll every 10s for live team executions
    refetchOnWindowFocus: true
  });
}

export function useOpProcedureExecutions(procedureId?: string, filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: [KEY, 'procedure-executions', procedureId, filters],
    queryFn: () => svc.procedureExecutions(String(procedureId), filters),
    enabled: Boolean(procedureId),
    refetchOnWindowFocus: false
  });
}

export function useOpExecutionMutations(executionId?: string) {
  const qc = useQueryClient();
  const eid = String(executionId);
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: [KEY, 'executions'] });
    if (executionId) {
      qc.invalidateQueries({ queryKey: [KEY, 'execution-detail', eid] });
    }
    qc.invalidateQueries({ queryKey: [KEY, 'procedure-executions'] });
    qc.invalidateQueries({ queryKey: [KEY, 'register'] });
    qc.invalidateQueries({ queryKey: [KEY, 'dashboard'] });
  };

  return {
    startExecution: useMutation({
      mutationFn: ({ procedureId, data }: { procedureId: string; data: Record<string, unknown> }) =>
        svc.startExecution(procedureId, data),
      onSuccess: invalidate
    }),
    recordStep: useMutation({
      mutationFn: ({ stepId, data }: { stepId: string; data: Record<string, unknown> }) =>
        svc.recordExecutionStep(eid, stepId, data),
      onSuccess: invalidate
    }),
    releaseHold: useMutation({
      mutationFn: ({ holdId, data }: { holdId: string; data: Record<string, unknown> }) =>
        svc.releaseHold(eid, holdId, data),
      onSuccess: invalidate
    }),
    logDeviation: useMutation({
      mutationFn: (data: Record<string, unknown>) =>
        svc.logDeviation(eid, data),
      onSuccess: invalidate
    }),
    recordHandover: useMutation({
      mutationFn: (data: Record<string, unknown>) =>
        svc.recordHandover(eid, data),
      onSuccess: invalidate
    }),
    completeExecution: useMutation({
      mutationFn: (data: Record<string, unknown>) =>
        svc.completeExecution(eid, data),
      onSuccess: invalidate
    }),
    abortExecution: useMutation({
      mutationFn: (data: Record<string, unknown>) =>
        svc.abortExecution(eid, data),
      onSuccess: invalidate
    })
  };
}

// Phase 6 Change Flags & Linked Records Hooks
export function useOpChangeFlags(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: [KEY, 'change-flags', filters],
    queryFn: () => svc.changeFlags(filters),
    refetchOnWindowFocus: false
  });
}

export function useOpProcedureChangeFlags(procedureId: string, filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: [KEY, 'procedure-change-flags', procedureId, filters],
    queryFn: () => svc.procedureChangeFlags(procedureId, filters),
    enabled: Boolean(procedureId),
    refetchOnWindowFocus: false
  });
}

export function useOpChangeFlagMutations(procedureId?: string) {
  const qc = useQueryClient();
  const pid = String(procedureId);
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: [KEY, 'change-flags'] });
    if (procedureId) {
      qc.invalidateQueries({ queryKey: [KEY, 'procedure-change-flags', pid] });
    }
    qc.invalidateQueries({ queryKey: [KEY, 'detail'] });
    qc.invalidateQueries({ queryKey: [KEY, 'dashboard'] });
  };

  return {
    createChangeFlag: useMutation({
      mutationFn: ({ procedureId: id, data }: { procedureId: string; data: Record<string, unknown> }) =>
        svc.createChangeFlag(id, data),
      onSuccess: invalidate
    }),
    resolveChangeFlag: useMutation({
      mutationFn: ({ flagId, data }: { flagId: string; data: Record<string, unknown> }) =>
        svc.resolveChangeFlag(flagId, data),
      onSuccess: invalidate
    }),
    dismissChangeFlag: useMutation({
      mutationFn: ({ flagId, data }: { flagId: string; data: Record<string, unknown> }) =>
        svc.dismissChangeFlag(flagId, data),
      onSuccess: invalidate
    })
  };
}

export function useOpLinkedRecords(procedureId: string, type?: string) {
  return useQuery({
    queryKey: [KEY, 'linked-records', procedureId, type],
    queryFn: () => svc.linkedRecords(procedureId, type),
    enabled: Boolean(procedureId),
    refetchOnWindowFocus: false
  });
}

export function useOpLinkedRecordMutations(procedureId: string) {
  const qc = useQueryClient();
  const pid = String(procedureId);
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: [KEY, 'linked-records', pid] });
    qc.invalidateQueries({ queryKey: [KEY, 'detail', pid] });
  };

  return {
    linkRecord: useMutation({
      mutationFn: (data: Record<string, unknown>) => svc.linkRecord(pid, data),
      onSuccess: invalidate
    }),
    unlinkRecord: useMutation({
      mutationFn: (linkId: string) => svc.unlinkRecord(linkId),
      onSuccess: invalidate
    })
  };
}

// Phase 7 Read-and-Understand Acknowledgment Hooks
export function useOpAcknowledgments(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: [KEY, 'acknowledgments', filters],
    queryFn: () => svc.acknowledgments(filters),
    refetchOnWindowFocus: false
  });
}

export function useOpProcedureAckStats(procedureId: string, revisionId?: string) {
  return useQuery({
    queryKey: [KEY, 'procedure-ack-stats', procedureId, revisionId],
    queryFn: () => svc.procedureAcknowledgments(procedureId, revisionId),
    enabled: Boolean(procedureId),
    refetchOnWindowFocus: false
  });
}

export function useOpAcknowledgmentMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: [KEY, 'acknowledgments'] });
    qc.invalidateQueries({ queryKey: [KEY, 'procedure-ack-stats'] });
    qc.invalidateQueries({ queryKey: [KEY, 'dashboard'] });
  };

  return {
    signAcknowledgment: useMutation({
      mutationFn: ({ recordId, data }: { recordId: string; data: Record<string, unknown> }) =>
        svc.signAcknowledgment(recordId, data),
      onSuccess: invalidate
    })
  };
}

// Phase 8 Safe Work Practices & JSA Hooks
export function useOpSwpPrograms(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: [KEY, 'swp-programs', filters],
    queryFn: () => svc.swpPrograms(filters),
    refetchOnWindowFocus: false
  });
}

export function useOpSwpProgram(programId?: string) {
  return useQuery({
    queryKey: [KEY, 'swp-program', programId],
    queryFn: () => svc.swpProgram(String(programId)),
    enabled: Boolean(programId),
    refetchOnWindowFocus: false
  });
}

export function useOpJsas(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: [KEY, 'jsas', filters],
    queryFn: () => svc.jsas(filters),
    refetchOnWindowFocus: false
  });
}

export function useOpJsa(jsaId?: string) {
  return useQuery({
    queryKey: [KEY, 'jsa-detail', jsaId],
    queryFn: () => svc.jsa(String(jsaId)),
    enabled: Boolean(jsaId),
    refetchOnWindowFocus: false
  });
}

export function useOpSwpMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: [KEY, 'swp-programs'] });
    qc.invalidateQueries({ queryKey: [KEY, 'jsas'] });
  };

  return {
    saveProgram: useMutation({
      mutationFn: (data: Record<string, unknown>) => svc.saveSwpProgram(data),
      onSuccess: invalidate
    }),
    createJsa: useMutation({
      mutationFn: (data: Record<string, unknown>) => svc.createJsa(data),
      onSuccess: invalidate
    }),
    signRoster: useMutation({
      mutationFn: ({ jsaId, data }: { jsaId: string; data: Record<string, unknown> }) =>
        svc.signJsaRoster(jsaId, data),
      onSuccess: invalidate
    }),
    approveJsa: useMutation({
      mutationFn: ({ jsaId, data }: { jsaId: string; data?: Record<string, unknown> }) =>
        svc.approveJsa(jsaId, data),
      onSuccess: invalidate
    })
  };
}

// Phase 9 Reports & Audit Package Hooks
export function useOpAuditPackages(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: [KEY, 'audit-packages', filters],
    queryFn: () => svc.auditPackages(filters),
    refetchOnWindowFocus: false
  });
}

export function useOpAuditPackage(packageId?: string) {
  return useQuery({
    queryKey: [KEY, 'audit-package-detail', packageId],
    queryFn: () => svc.auditPackage(String(packageId)),
    enabled: Boolean(packageId),
    refetchOnWindowFocus: false
  });
}

export function useOpControlledCopy(procedureId?: string, revisionId?: string) {
  return useQuery({
    queryKey: [KEY, 'controlled-copy', procedureId, revisionId],
    queryFn: () => svc.controlledCopy(String(procedureId), revisionId),
    enabled: Boolean(procedureId),
    refetchOnWindowFocus: false
  });
}

export function useOpReportMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: [KEY, 'audit-packages'] });
  };

  return {
    generatePackage: useMutation({
      mutationFn: (data: Record<string, unknown>) => svc.generateAuditPackage(data),
      onSuccess: invalidate
    })
  };
}
