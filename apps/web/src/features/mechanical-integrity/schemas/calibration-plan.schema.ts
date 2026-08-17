import { z } from 'zod';

export const calibrationPlanSchema = z.object({
  equipmentId: z.string().min(1, 'Equipment is required'),
  planTitle: z.string().min(1, 'Plan title is required'),
  instrumentType: z.string().min(1, 'Instrument type is required'),
  calibrationType: z.string().min(1, 'Calibration type is required'),
  toleranceType: z.string().optional(),
  toleranceValue: z.coerce.number().optional(),
  tolerancePercent: z.coerce.number().optional(),
  frequencyValue: z.coerce.number().positive().optional(),
  frequencyUnit: z.string().optional()
});

