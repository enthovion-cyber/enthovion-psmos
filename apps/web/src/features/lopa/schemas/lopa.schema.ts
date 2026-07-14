import { z } from 'zod';
import type { LopaCreateValues } from '../types/lopa.types';

export const lopaCreateSchema = z.object({
  creationMethod: z.string().min(1),
  title: z.string().min(3, 'Study title is required'),
  description: z.string().optional(),
  studyType: z.string().min(1, 'Study type is required'),
  source: z.string().min(1, 'Source is required'),
  hazopScenarioId: z.string().optional(),
  companyId: z.string().optional(),
  siteId: z.string().min(1, 'Site is required'),
  unitId: z.string().optional(),
  areaId: z.string().optional(),
  equipmentTag: z.string().optional(),
  equipmentId: z.string().optional(),
  ownerId: z.string().min(1, 'Owner is required'),
  facilitatorId: z.string().optional(),
  priority: z.string().optional(),
  dueDate: z.string().optional(),
  revalidationDueDate: z.string().optional(),
  confidentialityLevel: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  consequence: z.object({
    description: z.string().optional(),
    category: z.string().optional(),
    severity: z.string().optional(),
    impactedReceptor: z.string().optional(),
    tolerableEventFrequency: z.number().nullable().optional(),
    riskCriteriaSource: z.string().optional()
  }),
  initiatingEvent: z.object({
    description: z.string().optional(),
    eventCategory: z.string().optional(),
    frequencyMethod: z.string().optional(),
    libraryEvent: z.string().optional(),
    frequencyPerYear: z.number().nullable().optional(),
    frequencySource: z.string().optional()
  }),
  importedSafeguards: z.array(z.object({
    sourceSafeguardId: z.string().optional(),
    safeguardName: z.string().min(1),
    safeguardType: z.string().optional(),
    description: z.string().optional(),
    proposedLopaUse: z.string().optional(),
    creditedAsIpl: z.boolean().optional(),
    notes: z.string().optional()
  })),
  teamMembers: z.array(z.object({
    userId: z.string().optional(),
    contactId: z.string().optional(),
    displayName: z.string().optional(),
    fullName: z.string().optional(),
    email: z.string().optional(),
    role: z.string().min(1),
    discipline: z.string().optional(),
    required: z.boolean().optional(),
    organization: z.string().optional(),
    internalExternal: z.string().optional(),
    jobTitle: z.string().nullable().optional(),
    department: z.string().nullable().optional(),
    responsibility: z.string().optional(),
    reviewer: z.boolean().optional(),
    approver: z.boolean().optional(),
    facilitator: z.boolean().optional(),
    scribe: z.boolean().optional(),
    accessLevel: z.string().optional(),
    invitationRequired: z.boolean().optional(),
    invitationMode: z.string().optional(),
    invitationMessage: z.string().optional(),
    invitationDueDate: z.string().optional(),
    suggestionReasons: z.array(z.string()).optional(),
    suggestionSource: z.string().optional()
  })),
  sendInvitations: z.boolean().optional(),
  invitationMessage: z.string().optional(),
  invitationDueDate: z.string().optional()
});

export function defaultLopaCreateValues(): LopaCreateValues {
  return {
    creationMethod: 'manual',
    title: '',
    description: '',
    studyType: 'New LOPA',
    source: 'Manual',
    siteId: '',
    ownerId: '',
    priority: 'Medium',
    confidentialityLevel: 'Internal',
    tags: [],
    consequence: {},
    initiatingEvent: {},
    importedSafeguards: [],
    teamMembers: [],
    sendInvitations: false,
    invitationMessage: '',
    invitationDueDate: ''
  };
}
