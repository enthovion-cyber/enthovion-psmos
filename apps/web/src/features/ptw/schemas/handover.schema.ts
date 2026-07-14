import { z } from 'zod';

export const handoverProgressStatuses = ['Not Started', 'In Progress', 'Partially Complete', 'Complete', 'Stopped', 'Suspended'] as const;

export const checklistLabels = {
  workScopeReviewed: 'Work scope reviewed',
  permitStatusReviewed: 'Permit status reviewed',
  workProgressReviewed: 'Work progress reviewed',
  isolationVerifiedAndValid: 'Isolation verified and valid',
  gasTestWithinValidPeriod: 'Gas test within valid period',
  workforceAccountabilityReviewed: 'Workforce/accountability reviewed',
  openConflictsReviewed: 'Open conflicts reviewed',
  areaInspected: 'Area inspected',
  emergencyContactsReviewed: 'Emergency contacts reviewed',
  permitExpiryReviewed: 'Permit expiry reviewed',
  requiredAttachmentsReviewed: 'Required attachments reviewed',
  controlRoomNotifiedIfRequired: 'Control room notified if required'
} as const;

export type HandoverChecklistKey = keyof typeof checklistLabels;

export const handoverSchema = z.object({
  currentShiftName: z.string().min(1, 'Current shift is required'),
  currentShiftStart: z.string().min(1, 'Current shift start is required'),
  currentShiftEnd: z.string().min(1, 'Current shift end is required'),
  incomingShiftName: z.string().min(1, 'Incoming shift is required'),
  incomingShiftStart: z.string().min(1, 'Incoming shift start is required'),
  incomingShiftEnd: z.string().optional(),
  outgoingSupervisorId: z.string().optional(),
  outgoingSupervisorName: z.string().min(1, 'Outgoing supervisor is required'),
  incomingSupervisorId: z.string().optional(),
  incomingSupervisorName: z.string().min(1, 'Incoming supervisor is required'),
  incomingSupervisorContact: z.string().optional(),
  workProgressStatus: z.enum(handoverProgressStatuses),
  workProgressNotes: z.string().optional(),
  remainingWork: z.string().optional(),
  hazardsObserved: z.string().optional(),
  specialPrecautions: z.string().optional(),
  controlRoomMessage: z.string().optional(),
  incomingSupervisorComments: z.string().optional(),
  checklist: z.record(z.boolean()).default({})
});

export type HandoverValues = z.infer<typeof handoverSchema>;

export function defaultHandoverValues() {
  const now = new Date();
  const shiftEnd = new Date(now.getTime() + 4 * 60 * 60 * 1000);
  const incomingStart = shiftEnd;
  const incomingEnd = new Date(incomingStart.getTime() + 12 * 60 * 60 * 1000);
  return {
    currentShiftName: 'Day Shift',
    currentShiftStart: toLocal(now),
    currentShiftEnd: toLocal(shiftEnd),
    incomingShiftName: 'Night Shift',
    incomingShiftStart: toLocal(incomingStart),
    incomingShiftEnd: toLocal(incomingEnd),
    outgoingSupervisorName: '',
    incomingSupervisorName: '',
    incomingSupervisorContact: '',
    workProgressStatus: 'In Progress' as const,
    workProgressNotes: '',
    remainingWork: '',
    hazardsObserved: '',
    specialPrecautions: '',
    controlRoomMessage: '',
    incomingSupervisorComments: '',
    checklist: Object.fromEntries(Object.keys(checklistLabels).map((key) => [key, false]))
  };
}

function toLocal(date: Date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
