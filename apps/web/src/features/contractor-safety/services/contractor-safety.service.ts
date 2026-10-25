// apps/web/src/features/contractor-safety/services/contractor-safety.service.ts
import { api } from '@/services/api';
import type {
  AcknowledgeEvaluationPayload,
  ContractorDetail,
  ContractorDocument,
  ContractorPortalOverview,
  ContractorProfile,
  CreatePostJobEvaluationPayload,
  CsmContractorScorecardSummary,
  CsmContractorWorker,
  CsmDashboardResponse,
  CsmExpiringRadar,
  CsmGatePass,
  CsmGateScanResult,
  CsmInductionCourse,
  CsmLookupsResponse,
  CsmOshaAuditPackage,
  CsmPostJobEvaluation,
  CsmPtwEligibilityResult,
  CsmWorkerCertification,
  CsmWorkerDetail,
  CsmWorkerInduction
} from '../types/contractor-safety.types';

function unwrap<T>(response: { data: T | { data?: T } }): T {
  const body = response.data as { data?: T };
  return body && typeof body === 'object' && 'data' in body ? (body.data as T) : (response.data as T);
}

const base = '/contractor-safety';

export const contractorSafetyService = {
  // Lookups
  lookups: async () => {
    const res = await api.get<CsmLookupsResponse>(`${base}/lookups`);
    return unwrap<CsmLookupsResponse>(res);
  },

  // Dashboard
  dashboard: async () => {
    const res = await api.get<CsmDashboardResponse>(`${base}/dashboard`);
    return unwrap<CsmDashboardResponse>(res);
  },

  // Contractors List
  list: async (params?: Record<string, unknown>) => {
    const res = await api.get<ContractorProfile[]>(`${base}/contractors`, { params });
    return unwrap<ContractorProfile[]>(res);
  },

  // Contractor Detail
  getById: async (id: string) => {
    const res = await api.get<ContractorDetail>(`${base}/contractors/${id}`);
    return unwrap<ContractorDetail>(res);
  },

  // Create Contractor
  create: async (data: Record<string, unknown>) => {
    const res = await api.post<ContractorProfile>(`${base}/contractors`, data);
    return unwrap<ContractorProfile>(res);
  },

  // Update Contractor
  update: async (id: string, data: Record<string, unknown>) => {
    const res = await api.put<ContractorProfile>(`${base}/contractors/${id}`, data);
    return unwrap<ContractorProfile>(res);
  },

  // Regenerate Portal Token
  regenerateToken: async (id: string) => {
    const res = await api.post<{ portal_access_token: string; portal_token_expires_at: string; portal_status: string }>(
      `${base}/contractors/${id}/regenerate-token`
    );
    return unwrap<{ portal_access_token: string; portal_token_expires_at: string; portal_status: string }>(res);
  },

  // Documents
  getDocuments: async (contractorId: string) => {
    const res = await api.get<ContractorDocument[]>(`${base}/contractors/${contractorId}/documents`);
    return unwrap<ContractorDocument[]>(res);
  },

  addDocument: async (contractorId: string, data: Record<string, unknown>) => {
    const res = await api.post<ContractorDocument>(`${base}/contractors/${contractorId}/documents`, data);
    return unwrap<ContractorDocument>(res);
  },

  verifyDocument: async (docId: string, data: { verification_status: 'VERIFIED' | 'REJECTED'; rejection_reason?: string }) => {
    const res = await api.patch<ContractorDocument>(`${base}/documents/${docId}/verify`, data);
    return unwrap<ContractorDocument>(res);
  },

  deleteDocument: async (docId: string) => {
    const res = await api.delete<{ success: boolean; id: string }>(`${base}/documents/${docId}`);
    return unwrap<{ success: boolean; id: string }>(res);
  },

  // Prequalification & Scoring (Phase 2)
  getScoringRules: async () => {
    const res = await api.get<any>(`${base}/prequal/rules`);
    return unwrap<any>(res);
  },

  getContractorPrequal: async (contractorId: string) => {
    const res = await api.get<any>(`${base}/contractors/${contractorId}/prequal`);
    return unwrap<any>(res);
  },

  upsertMetrics: async (contractorId: string, data: Record<string, unknown>) => {
    const res = await api.post<any>(`${base}/contractors/${contractorId}/prequal/metrics`, data);
    return unwrap<any>(res);
  },

  evaluatePrequal: async (contractorId: string, data: Record<string, unknown>) => {
    const res = await api.post<any>(`${base}/contractors/${contractorId}/prequal/evaluate`, data);
    return unwrap<any>(res);
  },

  listVariances: async (status?: string) => {
    const res = await api.get<any[]>(`${base}/variances`, { params: status ? { status } : undefined });
    return unwrap<any[]>(res);
  },

  createVariance: async (contractorId: string, data: Record<string, unknown>) => {
    const res = await api.post<any>(`${base}/contractors/${contractorId}/variances`, data);
    return unwrap<any>(res);
  },

  approveVariance: async (varianceId: string, data: { decision: 'APPROVED' | 'REJECTED'; approval_notes?: string }) => {
    const res = await api.patch<any>(`${base}/variances/${varianceId}/decision`, data);
    return unwrap<any>(res);
  },

  // External Portal Endpoints (Token-based)
  getPortalOverview: async (token: string) => {
    const res = await api.get<ContractorPortalOverview>(`/contractor-portal/${token}`);
    return unwrap<ContractorPortalOverview>(res);
  },

  uploadPortalDocument: async (token: string, data: Record<string, unknown>) => {
    const res = await api.post<ContractorDocument>(`/contractor-portal/${token}/documents`, data);
    return unwrap<ContractorDocument>(res);
  },

  updatePortalProfile: async (token: string, data: Record<string, unknown>) => {
    const res = await api.put<ContractorProfile>(`/contractor-portal/${token}/profile`, data);
    return unwrap<ContractorProfile>(res);
  },

  // --------------------------------------------------------------------------
  // Phase 3: Worker Credentials & Certification Methods
  // --------------------------------------------------------------------------
  listWorkers: async (params?: {
    contractor_id?: string | undefined;
    craft_trade?: string | undefined;
    badge_status?: string | undefined;
    search?: string | undefined;
  }) => {
    const res = await api.get<{ workers: CsmContractorWorker[]; total: number }>(`${base}/workers`, {
      params
    });
    return unwrap<{ workers: CsmContractorWorker[]; total: number }>(res);
  },

  getExpiringRadar: async (days: number = 60) => {
    const res = await api.get<CsmExpiringRadar>(`${base}/workers/radar`, { params: { days } });
    return unwrap<CsmExpiringRadar>(res);
  },

  getWorkerById: async (id: string) => {
    const res = await api.get<CsmWorkerDetail>(`${base}/workers/${id}`);
    return unwrap<CsmWorkerDetail>(res);
  },

  createWorker: async (data: Record<string, unknown>) => {
    const res = await api.post<CsmContractorWorker>(`${base}/workers`, data);
    return unwrap<CsmContractorWorker>(res);
  },

  updateWorker: async (id: string, data: Record<string, unknown>) => {
    const res = await api.put<CsmContractorWorker>(`${base}/workers/${id}`, data);
    return unwrap<CsmContractorWorker>(res);
  },

  deleteWorker: async (id: string) => {
    const res = await api.delete<{ success: boolean }>(`${base}/workers/${id}`);
    return unwrap<{ success: boolean }>(res);
  },

  addCertification: async (workerId: string, data: Record<string, unknown>) => {
    const res = await api.post<CsmWorkerCertification>(`${base}/workers/${workerId}/certifications`, data);
    return unwrap<CsmWorkerCertification>(res);
  },

  verifyCertification: async (
    certId: string,
    data: { verification_status: string; verification_notes?: string }
  ) => {
    const res = await api.patch<CsmWorkerCertification>(`${base}/certifications/${certId}/verify`, data);
    return unwrap<CsmWorkerCertification>(res);
  },

  deleteCertification: async (certId: string) => {
    const res = await api.delete<{ success: boolean }>(`${base}/certifications/${certId}`);
    return unwrap<{ success: boolean }>(res);
  },

  checkPtwEligibility: async (workerId: string, requiredCertifications: string[]) => {
    const res = await api.post<CsmPtwEligibilityResult>(`${base}/workers/${workerId}/check-ptw`, {
      required_certifications: requiredCertifications
    });
    return unwrap<CsmPtwEligibilityResult>(res);
  },

  // Portal Worker Endpoints
  getPortalWorkers: async (token: string) => {
    const res = await api.get<CsmContractorWorker[]>(`/contractor-portal/${token}/workers`);
    return unwrap<CsmContractorWorker[]>(res);
  },

  createPortalWorker: async (token: string, data: Record<string, unknown>) => {
    const res = await api.post<CsmContractorWorker>(`/contractor-portal/${token}/workers`, data);
    return unwrap<CsmContractorWorker>(res);
  },

  addPortalWorkerCert: async (token: string, workerId: string, data: Record<string, unknown>) => {
    const res = await api.post<CsmWorkerCertification>(
      `/contractor-portal/${token}/workers/${workerId}/certifications`,
      data
    );
    return unwrap<CsmWorkerCertification>(res);
  },

  // --------------------------------------------------------------------------
  // Phase 4: Digital Site Inductions & QR Gate Pass Methods
  // --------------------------------------------------------------------------
  listInductionCourses: async (params?: { site_id?: string | undefined; target_audience?: string | undefined }) => {
    const res = await api.get<CsmInductionCourse[]>(`${base}/inductions`, { params });
    return unwrap<CsmInductionCourse[]>(res);
  },

  getInductionCourse: async (id: string) => {
    const res = await api.get<CsmInductionCourse>(`${base}/inductions/${id}`);
    return unwrap<CsmInductionCourse>(res);
  },

  createInductionCourse: async (data: Record<string, unknown>) => {
    const res = await api.post<CsmInductionCourse>(`${base}/inductions`, data);
    return unwrap<CsmInductionCourse>(res);
  },

  updateInductionCourse: async (id: string, data: Record<string, unknown>) => {
    const res = await api.put<CsmInductionCourse>(`${base}/inductions/${id}`, data);
    return unwrap<CsmInductionCourse>(res);
  },

  getWorkerInductions: async (workerId: string) => {
    const res = await api.get<CsmWorkerInduction[]>(`${base}/workers/${workerId}/inductions`);
    return unwrap<CsmWorkerInduction[]>(res);
  },

  submitInductionQuiz: async (
    workerId: string,
    courseId: string,
    data: { answers: number[]; hazard_acknowledgment_signed: boolean; signature_name: string }
  ) => {
    const res = await api.post<any>(`${base}/workers/${workerId}/inductions/${courseId}/submit`, data);
    return unwrap<any>(res);
  },

  listGatePasses: async (params?: { status?: string | undefined; search?: string | undefined }) => {
    const res = await api.get<CsmGatePass[]>(`${base}/gate-passes`, { params });
    return unwrap<CsmGatePass[]>(res);
  },

  issueGatePass: async (data: {
    worker_id: string;
    authorized_sites?: string[] | undefined;
    authorized_units?: string[] | undefined;
    valid_until?: string | undefined;
  }) => {
    const res = await api.post<CsmGatePass>(`${base}/gate-passes`, data);
    return unwrap<CsmGatePass>(res);
  },

  scanGatePass: async (data: { pass_code: string; gate_location?: string | undefined }) => {
    const res = await api.post<CsmGateScanResult>(`${base}/gate-passes/scan`, data);
    return unwrap<CsmGateScanResult>(res);
  },

  // Portal Inductions & Pass
  getPortalInductions: async (token: string) => {
    const res = await api.get<CsmInductionCourse[]>(`/contractor-portal/${token}/inductions`);
    return unwrap<CsmInductionCourse[]>(res);
  },

  submitPortalInduction: async (
    token: string,
    workerId: string,
    courseId: string,
    data: { answers: number[]; hazard_acknowledgment_signed: boolean; signature_name: string }
  ) => {
    const res = await api.post<any>(
      `/contractor-portal/${token}/workers/${workerId}/inductions/${courseId}/submit`,
      data
    );
    return unwrap<any>(res);
  },

  getPortalGatePass: async (token: string, workerId: string) => {
    const res = await api.get<CsmGatePass | null>(`/contractor-portal/${token}/workers/${workerId}/gate-pass`);
    return unwrap<CsmGatePass | null>(res);
  },

  // Phase 5: Post-Job Evaluations & Permanent Scorecard
  listEvaluations: async (params?: {
    contractor_id?: string | undefined;
    work_category?: string | undefined;
    limit?: number | undefined;
    offset?: number | undefined;
  }) => {
    const res = await api.get<{ evaluations: CsmPostJobEvaluation[]; total: number; limit: number; offset: number }>(
      `${base}/evaluations`,
      { params }
    );
    return unwrap<{ evaluations: CsmPostJobEvaluation[]; total: number; limit: number; offset: number }>(res);
  },

  getEvaluationById: async (id: string) => {
    const res = await api.get<CsmPostJobEvaluation>(`${base}/evaluations/${id}`);
    return unwrap<CsmPostJobEvaluation>(res);
  },

  createEvaluation: async (data: CreatePostJobEvaluationPayload) => {
    const res = await api.post<CsmPostJobEvaluation>(`${base}/evaluations`, data);
    return unwrap<CsmPostJobEvaluation>(res);
  },

  getContractorEvaluationSummary: async (contractorId: string) => {
    const res = await api.get<CsmContractorScorecardSummary>(`${base}/contractors/${contractorId}/evaluations/summary`);
    return unwrap<CsmContractorScorecardSummary>(res);
  },

  acknowledgeEvaluation: async (id: string, data: AcknowledgeEvaluationPayload) => {
    const res = await api.post<CsmPostJobEvaluation>(`${base}/evaluations/${id}/acknowledge`, data);
    return unwrap<CsmPostJobEvaluation>(res);
  },

  generateOshaAuditPackage: async (params?: { contractor_id?: string | undefined; year?: number | undefined }) => {
    const res = await api.get<CsmOshaAuditPackage>(`${base}/audit/package`, { params });
    return unwrap<CsmOshaAuditPackage>(res);
  },

  getPortalEvaluations: async (token: string) => {
    const res = await api.get<CsmPostJobEvaluation[]>(`/contractor-portal/${token}/evaluations`);
    return unwrap<CsmPostJobEvaluation[]>(res);
  },

  acknowledgePortalEvaluation: async (token: string, evalId: string, data: AcknowledgeEvaluationPayload) => {
    const res = await api.post<CsmPostJobEvaluation>(
      `/contractor-portal/${token}/evaluations/${evalId}/acknowledge`,
      data
    );
    return unwrap<CsmPostJobEvaluation>(res);
  }
};
