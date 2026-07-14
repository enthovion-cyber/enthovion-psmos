import { z } from 'zod';

export const incidentTeamMemberSchema = z.object({
  userId: z.string().optional().or(z.literal('')),
  displayName: z.string().min(1, 'Member name is required.'),
  email: z.string().email('Enter a valid email address.').optional().or(z.literal('')),
  profileStatus: z.string().optional(),
  phone: z.string().optional().or(z.literal('')),
  teamRole: z.string().min(1, 'Team role is required.'),
  discipline: z.string().optional().or(z.literal('')),
  department: z.string().optional().or(z.literal('')),
  organization: z.string().optional().or(z.literal('')),
  contractorCompany: z.string().optional().or(z.literal('')),
  responsibility: z.string().optional().or(z.literal('')),
  requiredMember: z.boolean().optional(),
  requiredRole: z.boolean().optional(),
  acceptanceRequired: z.boolean().optional(),
  approvalRequired: z.boolean().optional(),
  acceptanceDueAt: z.string().optional().or(z.literal('')),
  notificationMessage: z.string().optional().or(z.literal('')),
  availabilityStatus: z.string().optional().or(z.literal('')),
  conflictCheckRequired: z.boolean().optional(),
  conflictDeclared: z.boolean().optional(),
  conflictNotes: z.string().optional().or(z.literal('')),
  competencyCheckRequired: z.boolean().optional(),
  competencyStatus: z.string().optional().or(z.literal('')),
  trainingRecords: z.string().optional().or(z.literal('')),
  backupMember: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  changeReason: z.string().optional().or(z.literal(''))
});

export const incidentTeamMemberReplacementSchema = z.object({
  currentMemberId: z.string().min(1),
  replacementUserId: z.string().optional().or(z.literal('')),
  replacementDisplayName: z.string().min(1, 'Replacement member is required.'),
  replacementEmail: z.string().email().optional().or(z.literal('')),
  replacementReason: z.string().min(1, 'Replacement reason is required.'),
  transferResponsibilities: z.boolean().optional(),
  transferRaciAssignments: z.boolean().optional(),
  notifyOldMember: z.boolean().optional(),
  notifyNewMember: z.boolean().optional(),
  newMemberAcceptanceRequired: z.boolean().optional(),
  effectiveAt: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal(''))
});
