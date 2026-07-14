import { z } from 'zod';

export const hazopAttachmentMetadataSchema = z.object({
  category: z.string().min(1),
  description: z.string().optional(),
  linkedSection: z.string().default('General'),
  linkedNodeId: z.string().optional(),
  linkedScenarioId: z.string().optional(),
  linkedRecommendationId: z.string().optional(),
  linkedSafeguardId: z.string().optional(),
  linkedSessionId: z.string().optional(),
  linkedRecordId: z.string().optional(),
  visibility: z.string().default('Study Team'),
  reviewRequired: z.boolean().optional(),
  tags: z.string().optional(),
  notes: z.string().optional()
});

export const allowedHazopAttachmentExtensions = ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'docx', 'xlsx', 'csv', 'txt', 'pptx', 'dwg', 'dxf'];
