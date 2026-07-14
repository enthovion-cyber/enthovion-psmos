import { z } from 'zod';
export const lopaSessionAttendanceSchema = z.object({ teamMemberId: z.string().min(1), attendanceStatus: z.string().min(1) });
