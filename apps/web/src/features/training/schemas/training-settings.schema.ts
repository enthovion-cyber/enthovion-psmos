import { z } from 'zod';
export const trainingSettingsSchema = z.object({ defaultTrainingExpiryWarningDays: z.number().int().min(1), defaultCertificationExpiryWarningDays: z.number().int().min(1) });
