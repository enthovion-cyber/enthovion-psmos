// apps/web/src/features/contractor-safety/hooks/useContractorSafety.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { contractorSafetyService as svc } from '../services/contractor-safety.service';
import type {
  AcknowledgeEvaluationPayload,
  CreatePostJobEvaluationPayload
} from '../types/contractor-safety.types';

export const CSM_KEYS = {
  all: ['contractor-safety'] as const,
  lookups: () => [...CSM_KEYS.all, 'lookups'] as const,
  dashboard: () => [...CSM_KEYS.all, 'dashboard'] as const,
  list: (params?: Record<string, unknown>) => [...CSM_KEYS.all, 'list', params] as const,
  detail: (id: string) => [...CSM_KEYS.all, 'detail', id] as const,
  documents: (id: string) => [...CSM_KEYS.all, 'documents', id] as const,
  prequal: (id: string) => [...CSM_KEYS.all, 'prequal', id] as const,
  rules: () => [...CSM_KEYS.all, 'rules'] as const,
  variances: (status?: string) => [...CSM_KEYS.all, 'variances', status] as const,
  workers: (params?: Record<string, unknown>) => [...CSM_KEYS.all, 'workers', params] as const,
  worker: (id: string) => [...CSM_KEYS.all, 'worker', id] as const,
  radar: (days?: number) => [...CSM_KEYS.all, 'radar', days] as const,
  inductions: (params?: Record<string, unknown>) => [...CSM_KEYS.all, 'inductions', params] as const,
  induction: (id: string) => [...CSM_KEYS.all, 'induction', id] as const,
  workerInductions: (workerId: string) => [...CSM_KEYS.all, 'workerInductions', workerId] as const,
  gatePasses: (params?: Record<string, unknown>) => [...CSM_KEYS.all, 'gatePasses', params] as const,
  evaluations: (params?: Record<string, unknown>) => [...CSM_KEYS.all, 'evaluations', params] as const,
  evaluation: (id: string) => [...CSM_KEYS.all, 'evaluation', id] as const,
  scorecardSummary: (contractorId: string) => [...CSM_KEYS.all, 'scorecardSummary', contractorId] as const,
  auditPackage: (params?: Record<string, unknown>) => [...CSM_KEYS.all, 'auditPackage', params] as const,
  portal: (token: string) => ['contractor-portal', token] as const,
  portalWorkers: (token: string) => ['contractor-portal', token, 'workers'] as const,
  portalInductions: (token: string) => ['contractor-portal', token, 'inductions'] as const,
  portalPass: (token: string, workerId: string) => ['contractor-portal', token, 'pass', workerId] as const,
  portalEvaluations: (token: string) => ['contractor-portal', token, 'evaluations'] as const
};

export function useContractorLookups() {
  return useQuery({
    queryKey: CSM_KEYS.lookups(),
    queryFn: () => svc.lookups(),
    staleTime: 10 * 60 * 1000
  });
}

export function useContractorDashboard() {
  return useQuery({
    queryKey: CSM_KEYS.dashboard(),
    queryFn: () => svc.dashboard(),
    staleTime: 30 * 1000
  });
}

export function useContractorsList(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: CSM_KEYS.list(params),
    queryFn: () => svc.list(params)
  });
}

export function useContractorDetail(id: string) {
  return useQuery({
    queryKey: CSM_KEYS.detail(id),
    queryFn: () => svc.getById(id),
    enabled: Boolean(id)
  });
}

export function useContractorDocuments(contractorId: string) {
  return useQuery({
    queryKey: CSM_KEYS.documents(contractorId),
    queryFn: () => svc.getDocuments(contractorId),
    enabled: Boolean(contractorId)
  });
}

export function useCreateContractor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => svc.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CSM_KEYS.all });
    }
  });
}

export function useUpdateContractor(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => svc.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CSM_KEYS.detail(id) });
      qc.invalidateQueries({ queryKey: CSM_KEYS.list() });
      qc.invalidateQueries({ queryKey: CSM_KEYS.dashboard() });
    }
  });
}

export function useRegeneratePortalToken(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => svc.regenerateToken(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CSM_KEYS.detail(id) });
    }
  });
}

export function useAddDocument(contractorId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => svc.addDocument(contractorId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CSM_KEYS.detail(contractorId) });
      qc.invalidateQueries({ queryKey: CSM_KEYS.documents(contractorId) });
      qc.invalidateQueries({ queryKey: CSM_KEYS.dashboard() });
    }
  });
}

export function useVerifyDocument(contractorId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ docId, data }: { docId: string; data: { verification_status: 'VERIFIED' | 'REJECTED'; rejection_reason?: string } }) =>
      svc.verifyDocument(docId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CSM_KEYS.detail(contractorId) });
      qc.invalidateQueries({ queryKey: CSM_KEYS.documents(contractorId) });
      qc.invalidateQueries({ queryKey: CSM_KEYS.dashboard() });
    }
  });
}

export function useDeleteDocument(contractorId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (docId: string) => svc.deleteDocument(docId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CSM_KEYS.detail(contractorId) });
      qc.invalidateQueries({ queryKey: CSM_KEYS.documents(contractorId) });
      qc.invalidateQueries({ queryKey: CSM_KEYS.dashboard() });
    }
  });
}

// Prequalification & Scoring Hooks (Phase 2)
export function usePrequalRules() {
  return useQuery({
    queryKey: CSM_KEYS.rules(),
    queryFn: () => svc.getScoringRules(),
    staleTime: 10 * 60 * 1000
  });
}

export function useContractorPrequal(contractorId: string) {
  return useQuery({
    queryKey: CSM_KEYS.prequal(contractorId),
    queryFn: () => svc.getContractorPrequal(contractorId),
    enabled: Boolean(contractorId)
  });
}

export function useUpsertContractorMetrics(contractorId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => svc.upsertMetrics(contractorId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CSM_KEYS.prequal(contractorId) });
      qc.invalidateQueries({ queryKey: CSM_KEYS.detail(contractorId) });
      qc.invalidateQueries({ queryKey: CSM_KEYS.list() });
      qc.invalidateQueries({ queryKey: CSM_KEYS.dashboard() });
    }
  });
}

export function useEvaluateContractorPrequal(contractorId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => svc.evaluatePrequal(contractorId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CSM_KEYS.prequal(contractorId) });
      qc.invalidateQueries({ queryKey: CSM_KEYS.detail(contractorId) });
      qc.invalidateQueries({ queryKey: CSM_KEYS.list() });
      qc.invalidateQueries({ queryKey: CSM_KEYS.dashboard() });
    }
  });
}

export function useContractorVariances(status?: string) {
  return useQuery({
    queryKey: CSM_KEYS.variances(status),
    queryFn: () => svc.listVariances(status)
  });
}

export function useCreateContractorVariance(contractorId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => svc.createVariance(contractorId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CSM_KEYS.prequal(contractorId) });
      qc.invalidateQueries({ queryKey: CSM_KEYS.variances() });
      qc.invalidateQueries({ queryKey: CSM_KEYS.dashboard() });
    }
  });
}

export function useApproveContractorVariance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ varianceId, data }: { varianceId: string; data: { decision: 'APPROVED' | 'REJECTED'; approval_notes?: string } }) =>
      svc.approveVariance(varianceId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CSM_KEYS.variances() });
      qc.invalidateQueries({ queryKey: CSM_KEYS.all });
    }
  });
}

// External portal hook
export function useContractorPortal(token: string) {
  return useQuery({
    queryKey: CSM_KEYS.portal(token),
    queryFn: () => svc.getPortalOverview(token),
    enabled: Boolean(token),
    retry: 1
  });
}

export function useUploadPortalDocument(token: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => svc.uploadPortalDocument(token, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CSM_KEYS.portal(token) });
    }
  });
}

export function useUpdatePortalProfile(token: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => svc.updatePortalProfile(token, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CSM_KEYS.portal(token) });
    }
  });
}

// ============================================================================
// Phase 3: Worker & Certification Hooks
// ============================================================================

export function useContractorWorkers(params?: {
  contractor_id?: string | undefined;
  craft_trade?: string | undefined;
  badge_status?: string | undefined;
  search?: string | undefined;
}) {
  return useQuery({
    queryKey: CSM_KEYS.workers(params),
    queryFn: () => svc.listWorkers(params)
  });
}

export function useWorkerDetail(workerId: string) {
  return useQuery({
    queryKey: CSM_KEYS.worker(workerId),
    queryFn: () => svc.getWorkerById(workerId),
    enabled: Boolean(workerId)
  });
}

export function useExpiringRadar(days: number = 60) {
  return useQuery({
    queryKey: CSM_KEYS.radar(days),
    queryFn: () => svc.getExpiringRadar(days)
  });
}

export function useCreateWorker() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => svc.createWorker(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CSM_KEYS.workers() });
      qc.invalidateQueries({ queryKey: CSM_KEYS.all });
    }
  });
}

export function useUpdateWorker(workerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => svc.updateWorker(workerId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CSM_KEYS.worker(workerId) });
      qc.invalidateQueries({ queryKey: CSM_KEYS.workers() });
    }
  });
}

export function useDeleteWorker() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (workerId: string) => svc.deleteWorker(workerId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CSM_KEYS.workers() });
      qc.invalidateQueries({ queryKey: CSM_KEYS.radar() });
    }
  });
}

export function useAddCertification(workerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => svc.addCertification(workerId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CSM_KEYS.worker(workerId) });
      qc.invalidateQueries({ queryKey: CSM_KEYS.workers() });
      qc.invalidateQueries({ queryKey: CSM_KEYS.radar() });
    }
  });
}

export function useVerifyCertification(workerId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      certId,
      data
    }: {
      certId: string;
      data: { verification_status: string; verification_notes?: string };
    }) => svc.verifyCertification(certId, data),
    onSuccess: () => {
      if (workerId) {
        qc.invalidateQueries({ queryKey: CSM_KEYS.worker(workerId) });
      }
      qc.invalidateQueries({ queryKey: CSM_KEYS.workers() });
      qc.invalidateQueries({ queryKey: CSM_KEYS.radar() });
    }
  });
}

export function useDeleteCertification(workerId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (certId: string) => svc.deleteCertification(certId),
    onSuccess: () => {
      if (workerId) {
        qc.invalidateQueries({ queryKey: CSM_KEYS.worker(workerId) });
      }
      qc.invalidateQueries({ queryKey: CSM_KEYS.workers() });
      qc.invalidateQueries({ queryKey: CSM_KEYS.radar() });
    }
  });
}

export function useCheckPtwEligibility() {
  return useMutation({
    mutationFn: ({
      workerId,
      requiredCertifications
    }: {
      workerId: string;
      requiredCertifications: string[];
    }) => svc.checkPtwEligibility(workerId, requiredCertifications)
  });
}

export function usePortalWorkers(token: string) {
  return useQuery({
    queryKey: CSM_KEYS.portalWorkers(token),
    queryFn: () => svc.getPortalWorkers(token),
    enabled: Boolean(token)
  });
}

export function useCreatePortalWorker(token: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => svc.createPortalWorker(token, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CSM_KEYS.portalWorkers(token) });
    }
  });
}

export function useAddPortalWorkerCert(token: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      workerId,
      data
    }: {
      workerId: string;
      data: Record<string, unknown>;
    }) => svc.addPortalWorkerCert(token, workerId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CSM_KEYS.portalWorkers(token) });
    }
  });
}

// ============================================================================
// Phase 4: Induction Courses & QR Gate Pass Hooks
// ============================================================================

export function useInductionCourses(params?: {
  site_id?: string | undefined;
  target_audience?: string | undefined;
}) {
  return useQuery({
    queryKey: CSM_KEYS.inductions(params),
    queryFn: () => svc.listInductionCourses(params)
  });
}

export function useInductionCourseDetail(courseId: string) {
  return useQuery({
    queryKey: CSM_KEYS.induction(courseId),
    queryFn: () => svc.getInductionCourse(courseId),
    enabled: Boolean(courseId)
  });
}

export function useCreateInductionCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => svc.createInductionCourse(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CSM_KEYS.inductions() });
    }
  });
}

export function useWorkerInductions(workerId: string) {
  return useQuery({
    queryKey: CSM_KEYS.workerInductions(workerId),
    queryFn: () => svc.getWorkerInductions(workerId),
    enabled: Boolean(workerId)
  });
}

export function useSubmitInductionQuiz() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      workerId,
      courseId,
      data
    }: {
      workerId: string;
      courseId: string;
      data: { answers: number[]; hazard_acknowledgment_signed: boolean; signature_name: string };
    }) => svc.submitInductionQuiz(workerId, courseId, data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: CSM_KEYS.workerInductions(variables.workerId) });
      qc.invalidateQueries({ queryKey: CSM_KEYS.gatePasses() });
      qc.invalidateQueries({ queryKey: CSM_KEYS.workers() });
    }
  });
}

export function useGatePasses(params?: { status?: string | undefined; search?: string | undefined }) {
  return useQuery({
    queryKey: CSM_KEYS.gatePasses(params),
    queryFn: () => svc.listGatePasses(params)
  });
}

export function useIssueGatePass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      worker_id: string;
      authorized_sites?: string[] | undefined;
      authorized_units?: string[] | undefined;
      valid_until?: string | undefined;
    }) => svc.issueGatePass(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CSM_KEYS.gatePasses() });
      qc.invalidateQueries({ queryKey: CSM_KEYS.workers() });
    }
  });
}

export function useScanGatePass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { pass_code: string; gate_location?: string | undefined }) =>
      svc.scanGatePass(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CSM_KEYS.gatePasses() });
    }
  });
}

export function usePortalInductions(token: string) {
  return useQuery({
    queryKey: CSM_KEYS.portalInductions(token),
    queryFn: () => svc.getPortalInductions(token),
    enabled: Boolean(token)
  });
}

export function useSubmitPortalInduction(token: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      workerId,
      courseId,
      data
    }: {
      workerId: string;
      courseId: string;
      data: { answers: number[]; hazard_acknowledgment_signed: boolean; signature_name: string };
    }) => svc.submitPortalInduction(token, workerId, courseId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CSM_KEYS.portalWorkers(token) });
    }
  });
}

export function usePortalGatePass(token: string, workerId: string) {
  return useQuery({
    queryKey: CSM_KEYS.portalPass(token, workerId),
    queryFn: () => svc.getPortalGatePass(token, workerId),
    enabled: Boolean(token && workerId)
  });
}

// ----------------------------------------------------------------------------
// Phase 5: Post-Job Evaluations & OSHA Compliance Audit Hooks
// ----------------------------------------------------------------------------

export function usePostJobEvaluations(params?: {
  contractor_id?: string | undefined;
  work_category?: string | undefined;
  limit?: number | undefined;
  offset?: number | undefined;
}) {
  return useQuery({
    queryKey: CSM_KEYS.evaluations(params),
    queryFn: () => svc.listEvaluations(params)
  });
}

export function useEvaluationDetail(id: string) {
  return useQuery({
    queryKey: CSM_KEYS.evaluation(id),
    queryFn: () => svc.getEvaluationById(id),
    enabled: Boolean(id)
  });
}

export function useCreatePostJobEvaluation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePostJobEvaluationPayload) => svc.createEvaluation(data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: CSM_KEYS.evaluations() });
      qc.invalidateQueries({ queryKey: CSM_KEYS.scorecardSummary(vars.contractor_id) });
      qc.invalidateQueries({ queryKey: CSM_KEYS.detail(vars.contractor_id) });
      qc.invalidateQueries({ queryKey: CSM_KEYS.list() });
    }
  });
}

export function useContractorEvaluationSummary(contractorId: string) {
  return useQuery({
    queryKey: CSM_KEYS.scorecardSummary(contractorId),
    queryFn: () => svc.getContractorEvaluationSummary(contractorId),
    enabled: Boolean(contractorId)
  });
}

export function useAcknowledgeEvaluation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AcknowledgeEvaluationPayload }) =>
      svc.acknowledgeEvaluation(id, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: CSM_KEYS.evaluations() });
      qc.invalidateQueries({ queryKey: CSM_KEYS.evaluation(vars.id) });
    }
  });
}

export function useOshaAuditPackage(params?: {
  contractor_id?: string | undefined;
  year?: number | undefined;
}) {
  return useQuery({
    queryKey: CSM_KEYS.auditPackage(params),
    queryFn: () => svc.generateOshaAuditPackage(params)
  });
}

export function usePortalEvaluations(token: string) {
  return useQuery({
    queryKey: CSM_KEYS.portalEvaluations(token),
    queryFn: () => svc.getPortalEvaluations(token),
    enabled: Boolean(token)
  });
}

export function useAcknowledgePortalEvaluation(token: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ evalId, data }: { evalId: string; data: AcknowledgeEvaluationPayload }) =>
      svc.acknowledgePortalEvaluation(token, evalId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CSM_KEYS.portalEvaluations(token) });
    }
  });
}
