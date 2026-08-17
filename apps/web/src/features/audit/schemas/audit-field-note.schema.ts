import { z } from "zod";

export const auditFieldNoteSchema = z.object({
  noteTitle: z.string().min(1, "Note title is required."),
  noteType: z.string().min(1, "Note type is required."),
  noteText: z.string().min(1, "Note text is required."),
  criticality: z.string().optional(),
  visibility: z.string().optional(),
});
