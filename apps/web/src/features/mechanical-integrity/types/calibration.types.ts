export type MiCalibrationPlan = Record<string, unknown> & {
  id: string;
  planNumber?: string;
  planTitle?: string;
  equipmentTag?: string;
  instrumentType?: string;
  calibrationType?: string;
  status?: string;
  approvalStatus?: string;
  nextDueDate?: string | null;
  dueStatus?: string;
};

export type MiCalibrationRecord = Record<string, unknown> & {
  id: string;
  record_number?: string;
  status?: string;
  review_status?: string;
  result?: string | null;
};

export type MiCalibrationRegistryResponse = {
  rows: MiCalibrationPlan[];
  summary: Record<string, unknown>;
  lastUpdated?: string;
};

export type MiCalibrationRecordRegistryResponse = {
  rows: MiCalibrationRecord[];
  summary: Record<string, unknown>;
  lastUpdated?: string;
};

