import { z } from "zod";

export const auditExecutionResponseSchema = z.object({
  responseStatus: z.string().min(1, "Response status is required."),
  complianceResult: z.string().min(1, "Compliance result is required."),
  responseText: z.string().optional(),
  comment: z.string().optional(),
  naJustification: z.string().optional(),
}).superRefine((value, ctx) => {
  if (value.complianceResult === "Not Applicable" && !value.naJustification) ctx.addIssue({ code: "custom", path: ["naJustification"], message: "N/A justification is required." });
  if (["Non-Compliant", "Partially Compliant"].includes(value.complianceResult) && !value.comment) ctx.addIssue({ code: "custom", path: ["comment"], message: "Comment is required for non-compliance." });
});
