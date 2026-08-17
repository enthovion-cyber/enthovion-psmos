import { z } from 'zod';

export const criticalAlarmSchema = z.object({
  alarmTag: z.string().min(1, 'Alarm tag is required'),
  alarmName: z.string().min(1, 'Alarm name is required'),
  alarmPriority: z.string().optional(),
  siteId: z.string().optional(),
  equipmentId: z.string().optional(),
  status: z.string().optional()
}).passthrough();

export type CriticalAlarmSchemaInput = z.infer<typeof criticalAlarmSchema>;
