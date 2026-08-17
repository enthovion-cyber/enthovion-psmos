import { z } from "zod";

export const auditFieldFindingSchema = z.object({
  findingTitle: z.string().min(1, "Finding title is required."),
  findingType: z.string().min(1, "Finding type is required."),
  findingDescription: z.string().min(1, "Finding description is required."),
  criticality: z.string().min(1, "Criticality is required."),
  immediateConcern: z.boolean().optional(),
  stopWorkRecommended: z.boolean().optional(),
  recommendedAction: z.string().optional(),
});
