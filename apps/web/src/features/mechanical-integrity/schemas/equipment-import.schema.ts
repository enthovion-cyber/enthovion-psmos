import { z } from 'zod';

export const miEquipmentImportSchema = z.object({
  file: z.any().refine((file) => Boolean(file), 'Import file is required.'),
  validateOnly: z.boolean().default(true)
});
