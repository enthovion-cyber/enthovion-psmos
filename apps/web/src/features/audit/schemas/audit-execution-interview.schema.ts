import { z } from "zod";

export const auditExecutionInterviewSchema = z.object({
  interviewTitle: z.string().min(1, "Interview title is required."),
  intervieweeName: z.string().optional(),
  department: z.string().optional(),
  roleTitle: z.string().optional(),
  summary: z.string().optional(),
  followUpRequired: z.boolean().optional(),
});
