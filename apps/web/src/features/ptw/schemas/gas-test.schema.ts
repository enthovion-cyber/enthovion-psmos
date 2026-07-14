import { z } from 'zod';

export const gasTestTypes = ['Initial', 'Periodic Re-test', 'After Break', 'Before Hot Work', 'Before Confined Space Entry', 'After Alarm', 'Manual'] as const;
export const ventilationStatuses = ['Natural Ventilation', 'Forced Ventilation', 'Ventilation Off', 'Purged', 'Not Applicable'] as const;

const numberField = z.coerce.number().min(0, 'Value cannot be negative').optional().or(z.literal('').transform(() => undefined));

export const gasReadingSchema = z.object({
  gasCode: z.string().min(1, 'Gas code is required'),
  gasName: z.string().optional(),
  value: z.coerce.number().min(0, 'Value cannot be negative'),
  unit: z.string().min(1, 'Unit is required'),
  minLimit: numberField,
  maxLimit: numberField
});

export const gasTestSchema = z.object({
  testType: z.enum(gasTestTypes),
  testLocation: z.string().min(1, 'Test location is required'),
  testedAt: z.string().min(1, 'Test date/time is required'),
  testerId: z.string().optional(),
  testerName: z.string().min(1, 'Tester is required'),
  instrumentId: z.string().min(1, 'Instrument ID is required'),
  instrumentSerialNumber: z.string().optional(),
  calibrationDate: z.string().min(1, 'Calibration date is required'),
  calibrationExpiryDate: z.string().min(1, 'Calibration expiry date is required'),
  ventilationStatus: z.string().min(1, 'Ventilation status is required'),
  weatherCondition: z.string().optional(),
  remarks: z.string().optional(),
  o2: z.coerce.number({ invalid_type_error: 'O2 must be numeric' }).min(0, 'O2 cannot be negative'),
  lel: z.coerce.number({ invalid_type_error: 'LEL must be numeric' }).min(0, 'LEL cannot be negative'),
  h2s: numberField,
  co: numberField,
  so2: numberField,
  cl2: numberField,
  nh3: numberField,
  hf: numberField,
  customGasName: z.string().optional(),
  customGasValue: numberField,
  customGasUnit: z.string().optional(),
  customGasThreshold: numberField
}).superRefine((value, ctx) => {
  if (new Date(value.calibrationExpiryDate).getTime() <= new Date(value.testedAt).getTime()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['calibrationExpiryDate'], message: 'Calibration expiry date must be after test date/time' });
  }
  const hasCustom = Boolean(value.customGasName || value.customGasValue !== undefined || value.customGasUnit || value.customGasThreshold !== undefined);
  if (hasCustom) {
    if (!value.customGasName) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['customGasName'], message: 'Custom gas name is required' });
    if (value.customGasValue === undefined) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['customGasValue'], message: 'Custom gas value is required' });
    if (!value.customGasUnit) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['customGasUnit'], message: 'Custom gas unit is required' });
    if (value.customGasThreshold === undefined) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['customGasThreshold'], message: 'Custom gas threshold is required' });
  }
});

export type GasTestValues = z.infer<typeof gasTestSchema>;

export const gasThresholdSchema = z.object({
  siteId: z.string().optional(),
  permitType: z.string().optional(),
  areaClassification: z.string().optional(),
  gasCode: z.string().min(1, 'Gas code is required'),
  gasName: z.string().optional(),
  unit: z.string().min(1, 'Unit is required'),
  minLimit: numberField,
  maxLimit: numberField,
  alertLimit: numberField,
  actionLimit: numberField,
  retestIntervalMinutes: z.coerce.number().min(0).default(120),
  autoSuspendOnFail: z.boolean().default(true),
  autoSuspendOnOverdue: z.boolean().default(true),
  isActive: z.boolean().default(true),
  policy: z.string().optional()
});

export type GasThresholdValues = z.infer<typeof gasThresholdSchema>;

export function defaultGasTestValues(): GasTestValues {
  const now = new Date();
  const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  return {
    testType: 'Initial',
    testLocation: 'Permit work area',
    testedAt: now.toISOString().slice(0, 16),
    testerName: '',
    instrumentId: '',
    instrumentSerialNumber: '',
    calibrationDate: now.toISOString().slice(0, 10),
    calibrationExpiryDate: nextMonth.toISOString().slice(0, 10),
    ventilationStatus: 'Natural Ventilation',
    weatherCondition: '',
    remarks: '',
    o2: 20.9,
    lel: 0,
    h2s: 0,
    co: 0
  };
}
