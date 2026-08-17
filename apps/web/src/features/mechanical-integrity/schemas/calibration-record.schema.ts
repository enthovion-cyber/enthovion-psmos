import { z } from 'zod';

export const calibrationRecordSchema = z.object({
  equipmentId: z.string().optional(),
  planId: z.string().optional(),
  calibrationDate: z.string().min(1, 'Calibration date is required'),
  technicianName: z.string().optional(),
  vendorOrLab: z.string().optional(),
  referenceStandard: z.string().optional(),
  notes: z.string().optional()
});

