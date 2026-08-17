import { z } from 'zod';

export const drawingTagIndexSchema = z.object({
  tag_number: z.string().min(1, 'Tag number is required.'),
  tag_type: z.string().min(1, 'Tag type is required.'),
  tag_description: z.string().optional().nullable(),
  service: z.string().optional().nullable(),
  linked_module: z.string().optional().nullable(),
  linked_record_id: z.string().optional().nullable(),
  sheet_page_reference: z.string().optional().nullable(),
  coordinate_reference: z.string().optional().nullable(),
  verification_status: z.string().min(1, 'Verification status is required.'),
  source_method: z.string().min(1, 'Source method is required.'),
  mismatch_reason: z.string().optional().nullable(),
  notes: z.string().optional().nullable()
});
