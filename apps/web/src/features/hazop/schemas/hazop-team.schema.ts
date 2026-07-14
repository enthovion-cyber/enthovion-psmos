import { z } from 'zod';

export const hazopTeamMemberBaseSchema = z.object({
  userId: z.string().optional().or(z.literal('')),
  externalName: z.string().optional().or(z.literal('')),
  externalEmail: z.string().email().optional().or(z.literal('')),
  name: z.string().optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  companyName: z.string().optional().or(z.literal('')),
  contractorCompanyId: z.string().optional().or(z.literal('')),
  departmentId: z.string().optional().or(z.literal('')),
  discipline: z.string().min(1, 'Discipline is required'),
  studyRole: z.string().min(1, 'Study role is required'),
  permissionLevel: z.enum(['View only', 'Comment', 'Edit worksheet', 'Approve/sign-off']).default('Comment'),
  requiredAttendance: z.boolean().default(false),
  signoffRequired: z.boolean().default(false),
  attendanceRequirement: z.enum(['All sessions', 'Selected sessions', 'Review only']).default('All sessions'),
  status: z.enum(['Invited', 'Active', 'Declined', 'Removed', 'Replaced', 'Inactive']).default('Active'),
  notes: z.string().optional().or(z.literal(''))
});

export const hazopTeamMemberSchema = hazopTeamMemberBaseSchema.refine((value) => value.userId || value.externalName || value.name, { message: 'Select a user or enter an external participant', path: ['userId'] });

export const hazopTeamReplaceSchema = z.object({
  replacementMemberId: z.string().optional().or(z.literal('')),
  reason: z.string().optional().or(z.literal('')),
  replacement: hazopTeamMemberBaseSchema.partial().optional()
});
