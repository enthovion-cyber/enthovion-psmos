import { z } from "zod";

export const auditExecutionEvidenceSchema = z.object({
  evidenceTitle: z.string().min(1, "Evidence title is required."),
  evidenceType: z.string().min(1, "Evidence type is required."),
  evidenceDescription: z.string().optional(),
  documentId: z.string().optional(),
  storageFileId: z.string().optional(),
  relatedRecordId: z.string().optional(),
  confidentialityLevel: z.string().optional(),
}).superRefine((value, ctx) => {
  if (!value.documentId && !value.storageFileId && !value.relatedRecordId && value.evidenceType !== "Other") {
    ctx.addIssue({ code: "custom", path: ["documentId"], message: "Link Document Control, storage, or a related record." });
  }
});
