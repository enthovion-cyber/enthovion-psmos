import { api } from '@/services/api';
import type { GasTestValues, GasThresholdValues } from '../schemas/gas-test.schema';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export type GasReading = {
  id: string;
  gas_code: string;
  gas_name: string;
  value: number | null;
  unit: string;
  min_limit?: number | null;
  max_limit?: number | null;
  pass_fail: string;
  threshold_source?: string | null;
  created_at: string;
};

export type PermitGasTest = {
  id: string;
  permit_id: string;
  test_type?: string;
  test_location?: string | null;
  tested_at: string;
  tester_user_id?: string | null;
  tester_id?: string | null;
  tester_name?: string | null;
  instrument_id?: string | null;
  instrument_serial_number?: string | null;
  calibration_date?: string | null;
  calibration_expiry_date?: string | null;
  ventilation_status?: string | null;
  weather_condition?: string | null;
  o2?: number | null;
  lel?: number | null;
  h2s?: number | null;
  co?: number | null;
  custom_gases?: Record<string, number>;
  result?: string;
  result_status?: string;
  next_test_due_at?: string | null;
  next_retest_due_at?: string | null;
  retest_status?: string | null;
  validation_details?: { failures?: string[]; missing?: string[] };
  notes?: string | null;
  readings?: GasReading[];
};

export type GasThreshold = {
  id: string;
  site_id?: string | null;
  permit_type?: string | null;
  area_classification?: string | null;
  gas_key?: string;
  gas_code?: string;
  gas_name?: string;
  units?: string;
  unit?: string;
  min_value?: number | null;
  max_value?: number | null;
  min_limit?: number | null;
  max_limit?: number | null;
  alert_limit?: number | null;
  action_limit?: number | null;
  retest_interval_minutes?: number;
  auto_suspend_on_fail?: boolean;
  auto_suspend_on_overdue?: boolean;
  is_active?: boolean;
  policy?: string | null;
};

export type GasTestSummary = {
  gasTestRequired: boolean;
  latestStatus: string;
  lastTestedAt?: string | null;
  nextRetestDueAt?: string | null;
  retestCountdownSeconds?: number | null;
  tester?: string | null;
  instrumentId?: string | null;
  instrumentCalibrationStatus: string;
  permitGasStatus: string;
  blockers: string[];
  latest?: PermitGasTest | null;
  thresholds: GasThreshold[];
};

export type GasTestHistory = {
  id: string;
  gas_test_id?: string | null;
  event_type: string;
  description: string;
  user_id?: string | null;
  before_value?: unknown;
  after_value?: unknown;
  created_at: string;
};

export type GasTrend = {
  gasCode: string;
  points: Array<{ at: string; value: number; passFail: string }>;
};

export const ptwGasTestService = {
  list: (permitId: string) => api.get(`/ptw/${permitId}/gas-tests`).then(unwrap<PermitGasTest[]>),
  latest: (permitId: string) => api.get(`/ptw/${permitId}/gas-tests/latest`).then(unwrap<PermitGasTest | null>),
  summary: (permitId: string) => api.get(`/ptw/${permitId}/gas-tests/summary`).then(unwrap<GasTestSummary>),
  history: (permitId: string) => api.get(`/ptw/${permitId}/gas-tests/history`).then(unwrap<GasTestHistory[]>),
  trends: (permitId: string) => api.get(`/ptw/${permitId}/gas-tests/trends`).then(unwrap<GasTrend[]>),
  thresholdsForPermit: (permitId: string) => api.get(`/ptw/${permitId}/gas-thresholds`).then(unwrap<GasThreshold[]>),
  thresholds: (params?: { siteId?: string; permitType?: string }) => api.get('/ptw/gas-thresholds', { params }).then(unwrap<GasThreshold[]>),
  create: (permitId: string, input: GasTestValues) => api.post(`/ptw/${permitId}/gas-tests`, toGasTestApi(input)).then(unwrap<PermitGasTest>),
  update: (permitId: string, gasTestId: string, input: Partial<GasTestValues>) => api.patch(`/ptw/${permitId}/gas-tests/${gasTestId}`, toGasTestApi(input)).then(unwrap<PermitGasTest>),
  remove: (permitId: string, gasTestId: string) => api.delete(`/ptw/${permitId}/gas-tests/${gasTestId}`).then(unwrap<{ deleted: boolean; id: string }>),
  validate: (permitId: string, gasTestId: string) => api.post(`/ptw/${permitId}/gas-tests/${gasTestId}/validate`).then(unwrap<PermitGasTest>),
  checkOverdue: (permitId: string) => api.post(`/ptw/${permitId}/gas-tests/check-overdue`).then(unwrap<{ overdue: boolean; summary: GasTestSummary }>),
  createThreshold: (input: GasThresholdValues) => api.post('/ptw/gas-thresholds', input).then(unwrap<GasThreshold>),
  updateThreshold: (thresholdId: string, input: GasThresholdValues) => api.patch(`/ptw/gas-thresholds/${thresholdId}`, input).then(unwrap<GasThreshold>),
  removeThreshold: (thresholdId: string) => api.delete(`/ptw/gas-thresholds/${thresholdId}`).then(unwrap<{ deleted: boolean; id: string }>)
};

function toGasTestApi(input: Partial<GasTestValues>) {
  const customGases: Record<string, number> = {};
  const readings = [];
  for (const [key, label] of Object.entries({ so2: 'SO2', cl2: 'Cl2', nh3: 'NH3', hf: 'HF' })) {
    const value = input[key as keyof GasTestValues];
    if (typeof value === 'number') readings.push({ gasCode: label, gasName: label, value, unit: 'ppm' });
  }
  if (input.customGasName && typeof input.customGasValue === 'number') {
    customGases[input.customGasName] = input.customGasValue;
    readings.push({ gasCode: input.customGasName, gasName: input.customGasName, value: input.customGasValue, unit: input.customGasUnit ?? 'ppm', maxLimit: input.customGasThreshold });
  }
  return {
    ...input,
    calibrationDueDate: input.calibrationExpiryDate,
    notes: input.remarks,
    customGases,
    readings
  };
}
