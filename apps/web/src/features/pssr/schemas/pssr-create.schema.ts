import { z } from 'zod';

export const pssrCreateSchema = z.object({
  title: z.string().min(1, 'PSSR title is required'),
  description: z.string().optional(),
  pssrType: z.string().min(1, 'PSSR type is required'),
  startupType: z.string().min(1, 'Startup type is required'),
  triggerSource: z.string().default('Manual'),
  mocId: z.string().optional(),
  companyId: z.string().optional(),
  siteId: z.string().min(1, 'Site is required'),
  departmentId: z.string().optional(),
  unitId: z.string().optional(),
  areaId: z.string().optional(),
  requestedStartupAt: z.string().optional(),
  targetStartupAt: z.string().min(1, 'Target startup date is required'),
  coordinatorId: z.string().min(1, 'PSSR coordinator is required'),
  originatorId: z.string().optional(),
  priority: z.string().default('Medium'),
  riskLevel: z.string().default('Medium'),
  primaryEquipmentId: z.string().optional(),
  additionalEquipmentIds: z.array(z.string()).default([]),
  systemService: z.string().optional(),
  locationDescription: z.string().optional(),
  startupScope: z.record(z.any()).default({}),
  startupBoundaries: z.string().optional(),
  startupHazards: z.string().optional(),
  startupPrerequisites: z.string().min(1, 'Startup prerequisites are required'),
  temporaryControls: z.string().optional(),
  submit: z.boolean().default(true)
});

export type PSSRCreateValues = z.infer<typeof pssrCreateSchema>;
