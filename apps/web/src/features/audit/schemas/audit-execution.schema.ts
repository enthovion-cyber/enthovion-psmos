import { z } from "zod";

export const auditExecutionStartSchema = z.object({
  planId: z.string().optional(),
  checklistId: z.string().optional(),
  executionTitle: z.string().min(1, "Execution title is required."),
  executionCode: z.string().min(1, "Execution code is required."),
  executionMode: z.string().min(1, "Execution mode is required."),
  leadAuditorUserId: z.string().min(1, "Lead auditor is required."),
  siteId: z.string().optional(),
}).superRefine((value, ctx) => {
  if (!value.planId && !value.checklistId) ctx.addIssue({ code: "custom", path: ["checklistId"], message: "Select a plan or checklist before starting execution." });
});
