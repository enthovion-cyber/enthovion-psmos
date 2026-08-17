import { useMutation, useQueryClient } from "@tanstack/react-query";
import { auditEvidenceService } from "../services/audit-evidence.service";

export function useAuditEvidenceMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["audit", "evidence"] });
  return {
    create: useMutation({ mutationFn: auditEvidenceService.create, onSuccess: invalidate }),
    upload: useMutation({ mutationFn: auditEvidenceService.upload, onSuccess: invalidate }),
    linkDocument: useMutation({ mutationFn: auditEvidenceService.linkDocument, onSuccess: invalidate }),
    linkModuleRecord: useMutation({ mutationFn: auditEvidenceService.linkModuleRecord, onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) => auditEvidenceService.update(id, payload), onSuccess: invalidate }),
    transition: useMutation({ mutationFn: ({ id, action, payload }: { id: string; action: string; payload?: Record<string, unknown> }) => auditEvidenceService.transition(id, action, payload), onSuccess: invalidate }),
    addLink: useMutation({ mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) => auditEvidenceService.addLink(id, payload), onSuccess: invalidate }),
    removeLink: useMutation({ mutationFn: ({ id, linkId, reason }: { id: string; linkId: string; reason: string }) => auditEvidenceService.removeLink(id, linkId, reason), onSuccess: invalidate }),
    review: useMutation({ mutationFn: ({ id, action, payload }: { id: string; action: "verify" | "reject" | "request-rework"; payload: Record<string, unknown> }) => auditEvidenceService.review(id, action, payload), onSuccess: invalidate }),
    waiveRequirement: useMutation({ mutationFn: ({ id, reason }: { id: string; reason: string }) => auditEvidenceService.waiveRequirement(id, reason), onSuccess: invalidate }),
    saveRequirement: useMutation({ mutationFn: ({ id, payload }: { id?: string; payload: Record<string, unknown> }) => auditEvidenceService.saveRequirement(payload, id), onSuccess: invalidate }),
    saveRequest: useMutation({ mutationFn: ({ id, payload }: { id?: string; payload: Record<string, unknown> }) => auditEvidenceService.saveRequest(payload, id), onSuccess: invalidate }),
    requestTransition: useMutation({ mutationFn: ({ id, action, payload }: { id: string; action: string; payload?: Record<string, unknown> }) => auditEvidenceService.requestTransition(id, action, payload), onSuccess: invalidate }),
    detectGaps: useMutation({ mutationFn: auditEvidenceService.detectGaps, onSuccess: invalidate }),
    resolveGap: useMutation({ mutationFn: ({ id, resolutionNote }: { id: string; resolutionNote: string }) => auditEvidenceService.resolveGap(id, resolutionNote), onSuccess: invalidate }),
    savePackage: useMutation({ mutationFn: auditEvidenceService.savePackage, onSuccess: invalidate }),
    prepareManifest: useMutation({ mutationFn: auditEvidenceService.prepareManifest, onSuccess: invalidate }),
    addPackageEvidence: useMutation({ mutationFn: ({ id, evidenceId }: { id: string; evidenceId: string }) => auditEvidenceService.addPackageEvidence(id, evidenceId), onSuccess: invalidate }),
  };
}
