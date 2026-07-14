import { z } from 'zod';

export const lopaSessionSchema = z.object({
  title: z.string().min(1),
  sessionType: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  facilitatorMemberId: z.string().min(1)
});
