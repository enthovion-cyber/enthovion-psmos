import { z } from 'zod';

export const reportTemplateSchema = z.object({
  templateName: z.string().min(1),
  reportCategory: z.string().min(1),
  reportType: z.string().min(1),
  description: z.string().optional(),
  outputFormats: z.array(z.string()).min(1).optional()
});
