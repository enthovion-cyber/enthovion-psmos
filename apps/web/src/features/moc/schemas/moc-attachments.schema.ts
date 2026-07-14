import { z } from 'zod';

export const mocAttachmentSchema = z.object({ title: z.string().min(1), attachmentType: z.string().min(1), description: z.string().optional(), relatedSection: z.string().optional() });
