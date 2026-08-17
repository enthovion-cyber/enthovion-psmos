import { z } from 'zod';

export const workerSchema = z.object({
  displayName: z.string().min(1),
  workEmail: z.string().email().optional().or(z.literal('')),
  employeeId: z.string().optional(),
  contractorId: z.string().optional(),
  badgeNumber: z.string().optional(),
  workerType: z.string().default('Employee'),
  contractorCompanyName: z.string().optional()
}).refine((value) => Boolean(value.workEmail || value.employeeId || value.contractorId || value.badgeNumber), 'At least one unique identifier is required.');
