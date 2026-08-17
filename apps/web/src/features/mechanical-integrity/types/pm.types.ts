export type MiPmPlan = Record<string, unknown> & {
  id: string;
  planNumber?: string;
  planTitle?: string;
  equipmentTag?: string;
  pmTaskType?: string;
  status?: string;
  approvalStatus?: string;
  nextDueDate?: string | null;
  dueStatus?: string;
};

export type MiPmRecord = Record<string, unknown> & {
  id: string;
  record_number?: string;
  status?: string;
  review_status?: string;
  result?: string | null;
};

export type MiPmRegistryResponse = {
  rows: MiPmPlan[];
  summary: Record<string, unknown>;
  lastUpdated?: string;
};

export type MiPmRecordRegistryResponse = {
  rows: MiPmRecord[];
  summary: Record<string, unknown>;
  lastUpdated?: string;
};

