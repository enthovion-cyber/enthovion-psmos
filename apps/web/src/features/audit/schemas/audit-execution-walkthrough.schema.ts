import { z } from "zod";

export const auditExecutionWalkthroughSchema = z.object({
  walkthroughTitle: z.string().min(1, "Walkthrough title is required."),
  observations: z.string().optional(),
  fieldConditions: z.string().optional(),
  followUpRequired: z.boolean().optional(),
});
