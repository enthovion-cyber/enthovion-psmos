export interface ReliefOccurrence {
  id: string;
  occurrence_number?: string;
  occurrenceNumber?: string;
  relief_device_id?: string;
  due_date?: string;
  dueDate?: string;
  due_basis?: string;
  status?: string;
  completed_test_id?: string | null;
}

export interface ReliefSchedulerRunResult {
  processed: number;
  results: Array<Record<string, unknown>>;
}
