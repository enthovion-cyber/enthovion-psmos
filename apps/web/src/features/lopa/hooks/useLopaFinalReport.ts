import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { lopaFinalReportService } from '../services/lopa-final-report.service';
import type { LopaFinalReportFilters, LopaReportGenerateInput, LopaReportPackageInput, LopaReportPublishInput, LopaReportShareInput } from '../types/lopa-final-report.types';

export function useLopaFinalReport(id: string, filters: LopaFinalReportFilters = {}) {
  return useQuery({ queryKey: ['lopa', 'final-report', id, filters], queryFn: () => lopaFinalReportService.get(id, filters), enabled: !!id });
}

export function useLopaReportMutations(id: string) {
  const qc = useQueryClient();
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['lopa', 'final-report', id] });
    void qc.invalidateQueries({ queryKey: ['lopa', 'overview', id] });
    void qc.invalidateQueries({ queryKey: ['lopa', 'history', id] });
  };
  return {
    updateSections: useMutation({ mutationFn: (values: { sections: any[]; reason?: string }) => lopaFinalReportService.updateSections(id, values), onSuccess: invalidate }),
    preview: useMutation({ mutationFn: (values: LopaReportGenerateInput) => lopaFinalReportService.preview(id, values), onSuccess: invalidate }),
    generate: useMutation({ mutationFn: (values: LopaReportGenerateInput) => lopaFinalReportService.generate(id, values), onSuccess: invalidate }),
    generatePackage: useMutation({ mutationFn: (values: LopaReportPackageInput) => lopaFinalReportService.generatePackage(id, values), onSuccess: invalidate }),
    markOfficial: useMutation({ mutationFn: ({ reportId, reason }: { reportId: string; reason: string }) => lopaFinalReportService.markOfficial(id, reportId, reason), onSuccess: invalidate }),
    publish: useMutation({ mutationFn: ({ reportId, values }: { reportId: string; values: LopaReportPublishInput }) => lopaFinalReportService.publish(id, reportId, values), onSuccess: invalidate }),
    supersede: useMutation({ mutationFn: ({ reportId, reason }: { reportId: string; reason: string }) => lopaFinalReportService.supersede(id, reportId, reason), onSuccess: invalidate }),
    archive: useMutation({ mutationFn: ({ reportId, reason }: { reportId: string; reason?: string }) => lopaFinalReportService.archive(id, reportId, reason), onSuccess: invalidate }),
    restore: useMutation({ mutationFn: ({ reportId, reason }: { reportId: string; reason?: string }) => lopaFinalReportService.restore(id, reportId, reason), onSuccess: invalidate }),
    createSnapshot: useMutation({ mutationFn: () => lopaFinalReportService.createSnapshot(id), onSuccess: invalidate }),
    exportExcel: useMutation({ mutationFn: (values: LopaReportGenerateInput) => lopaFinalReportService.exportExcel(id, values), onSuccess: invalidate }),
    exportCsv: useMutation({ mutationFn: (values: LopaReportGenerateInput) => lopaFinalReportService.exportCsv(id, values), onSuccess: invalidate }),
    exportAuditPackage: useMutation({ mutationFn: (values: LopaReportPackageInput) => lopaFinalReportService.exportAuditPackage(id, values), onSuccess: invalidate }),
    share: useMutation({ mutationFn: (values: LopaReportShareInput) => lopaFinalReportService.share(id, values), onSuccess: invalidate }),
    revokeShare: useMutation({ mutationFn: ({ distributionId, reason }: { distributionId: string; reason?: string }) => lopaFinalReportService.revokeShare(id, distributionId, reason), onSuccess: invalidate }),
    resendShare: useMutation({ mutationFn: (distributionId: string) => lopaFinalReportService.resendShare(id, distributionId), onSuccess: invalidate })
  };
}
