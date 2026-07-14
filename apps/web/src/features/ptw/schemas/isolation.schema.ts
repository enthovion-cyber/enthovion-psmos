import { z } from 'zod';

export const energyTypes = ['Electrical', 'Mechanical', 'Pneumatic', 'Hydraulic', 'Thermal', 'Chemical', 'Gravitational', 'Stored Pressure', 'Rotating Equipment', 'Radiation', 'Other'] as const;
export const requiredPositions = ['Open', 'Closed', 'Locked Open', 'Locked Closed', 'Blinded', 'Spaded', 'Disconnected', 'Racked Out', 'Drained', 'Depressurized', 'Purged', 'Vented', 'Isolated', 'Other'] as const;
export const isolationStatuses = ['Planned', 'Ready For Confirmation', 'Confirmed', 'Verified', 'De-Isolation Started', 'De-Isolated', 'Removal Verified', 'Cancelled'] as const;

export const isolationPointSchema = z.object({
  energyType: z.enum(energyTypes),
  equipmentId: z.string().optional(),
  equipmentTag: z.string().optional(),
  isolationPoint: z.string().min(1, 'Isolation point tag is required'),
  isolationPointTag: z.string().optional(),
  isolationPointDescription: z.string().optional(),
  sourceDescription: z.string().optional(),
  valveTag: z.string().optional(),
  breakerTag: z.string().optional(),
  blindSpadeNumber: z.string().optional(),
  requiredPosition: z.enum(requiredPositions),
  normalPosition: z.string().optional(),
  currentPosition: z.string().optional(),
  lockNumber: z.string().optional(),
  lockHolder: z.string().optional(),
  lockHolderName: z.string().optional(),
  lockHolderUserId: z.string().optional(),
  isolationMethod: z.string().optional(),
  isolationStatus: z.enum(isolationStatuses).optional(),
  verificationRequired: z.boolean().default(false),
  secondPersonVerificationRequired: z.boolean().default(false),
  notes: z.string().optional()
}).superRefine((value, ctx) => {
  const status = value.isolationStatus;
  if (status === 'Confirmed' || status === 'Verified') {
    if (!value.lockNumber) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['lockNumber'], message: 'Lock number is required when confirmed' });
    if (!value.lockHolderName && !value.lockHolder) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['lockHolderName'], message: 'Lock holder is required when confirmed' });
  }
  if (['Blinded', 'Spaded'].includes(value.requiredPosition) && !value.blindSpadeNumber) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['blindSpadeNumber'], message: 'Blind/spade number is required' });
  }
  if (value.energyType === 'Electrical' && !value.breakerTag) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['breakerTag'], message: 'Breaker tag is required for electrical isolation' });
  }
  if ((value.isolationMethod ?? '').toLowerCase().includes('valve') && !value.valveTag) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['valveTag'], message: 'Valve tag is required for valve isolation' });
  }
});

export type IsolationPointValues = z.infer<typeof isolationPointSchema>;

export function defaultIsolationPointValues(equipmentTag?: string | null): IsolationPointValues {
  return {
    energyType: 'Mechanical',
    equipmentTag: equipmentTag ?? '',
    isolationPoint: '',
    isolationPointTag: '',
    isolationPointDescription: '',
    sourceDescription: '',
    valveTag: '',
    breakerTag: '',
    blindSpadeNumber: '',
    requiredPosition: 'Closed',
    normalPosition: '',
    currentPosition: '',
    lockNumber: '',
    lockHolder: '',
    lockHolderName: '',
    isolationMethod: 'Valve isolation',
    isolationStatus: 'Planned',
    verificationRequired: true,
    secondPersonVerificationRequired: true,
    notes: ''
  };
}
