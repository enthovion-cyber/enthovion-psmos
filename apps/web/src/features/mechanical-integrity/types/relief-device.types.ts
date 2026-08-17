export interface ReliefDevice {
  id: string;
  device_tag?: string;
  deviceTag?: string;
  device_name?: string;
  deviceName?: string;
  device_type?: string;
  deviceType?: string;
  service_fluid?: string;
  serviceFluid?: string;
  setPressure?: number | null;
  ratedCapacity?: number | null;
  status?: string;
  safety_critical?: boolean;
  safetyCritical?: boolean;
  protected_equipment_count?: number;
  protectedEquipmentCount?: number;
  last_test_date?: string | null;
  lastTestDate?: string | null;
  next_test_due_date?: string | null;
  nextTestDueDate?: string | null;
  due_status?: string;
  dueStatus?: string;
  last_test_result?: string;
  lastTestResult?: string;
  pop_test_result?: string;
  popTestResult?: string;
  leak_test_result?: string;
  leakTestResult?: string;
  certificate_status?: string;
  certificateStatus?: string;
  seal_status?: string;
  sealStatus?: string;
  car_seal_status?: string;
  carSealStatus?: string;
  active_impairment?: boolean;
  activeImpairment?: boolean;
  startup_blocked?: boolean;
  startupBlocked?: boolean;
  readiness_status?: string;
  readinessStatus?: string;
  readiness_blockers_json?: string[];
  readinessBlockers?: string[];
}

export interface ReliefSummary {
  totalReliefDevices?: number;
  activeReliefDevices?: number;
  safetyCritical?: number;
  protectedEquipmentCount?: number;
  equipmentMissingReliefProtection?: number;
  testsDueNext30Days?: number;
  testsDueNext90Days?: number;
  overdueTests?: number;
  criticalEquipmentPsvOverdue?: number;
  failedTests?: number;
  popTestFailed?: number;
  leakTestFailed?: number;
  certificatesMissingOrExpiring?: number;
  removedOutOfService?: number;
  activeImpairmentsBypasses?: number;
  mocRequired?: number;
  startupBlocked?: number;
}

export interface ReliefDeviceRegistryResponse {
  rows?: ReliefDevice[];
  summary?: ReliefSummary;
  lastUpdated?: string;
}

export interface ReliefDeviceDetailResponse {
  device: ReliefDevice;
  technicalData?: Record<string, unknown> | null;
  basis?: Record<string, unknown> | null;
  testRequirement?: Record<string, unknown> | null;
  seals?: Record<string, unknown> | null;
  protectedEquipment?: Record<string, unknown>[];
  tests?: Record<string, unknown>[];
  certificates?: Record<string, unknown>[];
  occurrences?: Record<string, unknown>[];
  history?: Record<string, unknown>[];
  actions?: Record<string, unknown>;
}
