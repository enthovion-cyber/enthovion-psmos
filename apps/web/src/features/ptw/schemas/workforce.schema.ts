import { z } from 'zod';

export const workerTypes = ['Internal', 'Contractor', 'Visitor'] as const;
export const workerRoles = ['Permit Holder', 'Performing Authority', 'Area Authority', 'Permit Issuer', 'Worker', 'Contractor Supervisor', 'Fire Watch', 'Confined Space Attendant', 'Confined Space Entrant', 'Entry Supervisor', 'Gas Tester', 'Isolation Authority', 'Standby Person', 'Safety Watch', 'Visitor', 'Other'] as const;

export const workerSchema = z.object({
  userId: z.string().optional(),
  workerName: z.string().min(1, 'Worker name is required'),
  workerType: z.enum(workerTypes),
  employerCompany: z.string().optional(),
  contractorCompanyId: z.string().optional(),
  trade: z.string().min(1, 'Trade is required'),
  badgeId: z.string().optional(),
  contactNumber: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  roleOnPermit: z.enum(workerRoles),
  isPermitHolder: z.boolean().default(false),
  isPerformingAuthority: z.boolean().default(false),
  isAreaAuthority: z.boolean().default(false),
  isPermitIssuer: z.boolean().default(false),
  isFireWatch: z.boolean().default(false),
  isAttendant: z.boolean().default(false),
  isEntrySupervisor: z.boolean().default(false),
  isGasTester: z.boolean().default(false),
  isIsolationAuthority: z.boolean().default(false),
  briefingRequired: z.boolean().default(true),
  briefingCompleted: z.boolean().default(false),
  notes: z.string().optional()
}).superRefine((value, ctx) => {
  if (value.workerType === 'Contractor' && !value.employerCompany && !value.contractorCompanyId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['employerCompany'], message: 'Contractor company is required' });
  }
  if (value.workerType === 'Contractor' && !value.contactNumber) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['contactNumber'], message: 'Contact number is required for contractor workers' });
  }
  if (value.roleOnPermit === 'Confined Space Entrant' && (!value.emergencyContactName || !value.emergencyContactPhone)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['emergencyContactName'], message: 'Emergency contact is required for confined space entrants' });
  }
});

export type WorkerValues = z.infer<typeof workerSchema>;

export const briefingSchema = z.object({
  briefingTitle: z.string().min(1, 'Briefing title is required'),
  briefingTopic: z.string().min(1, 'Briefing topic is required'),
  briefingNotes: z.string().optional(),
  conductedBy: z.string().optional(),
  conductedAt: z.string().min(1, 'Conducted date/time is required'),
  requiredForAllWorkers: z.boolean().default(true)
});

export type BriefingValues = z.infer<typeof briefingSchema>;

export function defaultWorkerValues(): WorkerValues {
  return {
    workerName: '',
    workerType: 'Internal',
    employerCompany: '',
    trade: '',
    badgeId: '',
    contactNumber: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    roleOnPermit: 'Worker',
    isPermitHolder: false,
    isPerformingAuthority: false,
    isAreaAuthority: false,
    isPermitIssuer: false,
    isFireWatch: false,
    isAttendant: false,
    isEntrySupervisor: false,
    isGasTester: false,
    isIsolationAuthority: false,
    briefingRequired: true,
    briefingCompleted: false,
    notes: ''
  };
}

export function defaultBriefingValues(): BriefingValues {
  return {
    briefingTitle: 'Permit Toolbox Talk',
    briefingTopic: '',
    briefingNotes: '',
    conductedAt: new Date().toISOString().slice(0, 16),
    requiredForAllWorkers: true
  };
}
