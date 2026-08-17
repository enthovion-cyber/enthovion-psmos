import { useQuery } from "@tanstack/react-query";
import { auditChecklistService as s } from "../services/audit-checklist.service";
export function useAuditQuestionBank(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: ["audit", "question-bank", params],
    queryFn: () => s.questionBank(params),
  });
}
