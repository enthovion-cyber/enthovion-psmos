import { z } from 'zod';

export const lopaTeamMemberSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  discipline: z.string().min(1),
  studyRole: z.string().min(1),
  responsibilityDescription: z.string().optional()
});
