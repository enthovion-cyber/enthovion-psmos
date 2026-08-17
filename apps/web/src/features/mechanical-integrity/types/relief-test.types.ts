export interface ReliefTest {
  id: string;
  test_record_number?: string;
  testRecordNumber?: string;
  relief_device_id?: string;
  reliefDeviceId?: string;
  reliefDeviceTag?: string;
  protected_equipment_id?: string;
  protectedEquipmentId?: string;
  protectedEquipmentTag?: string;
  test_date?: string;
  testDate?: string;
  test_type?: string;
  testType?: string;
  status?: string;
  review_status?: string;
  reviewStatus?: string;
  final_result?: string;
  finalResult?: string;
  test_vendor?: string;
  technician_name?: string;
}

export interface ReliefTestRegistryResponse {
  rows?: ReliefTest[];
  summary?: Record<string, unknown>;
  lastUpdated?: string;
}

export interface ReliefTestDetailResponse {
  test: ReliefTest;
  result?: Record<string, unknown> | null;
  leakTest?: Record<string, unknown> | null;
  certificates?: Record<string, unknown>[];
  actions?: Record<string, unknown>;
}
