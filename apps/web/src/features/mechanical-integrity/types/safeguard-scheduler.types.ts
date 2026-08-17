import type { MiSafeguardRow } from './safeguard-common.types';

export type SafeguardOccurrence = MiSafeguardRow & {
  safeguardType?: string;
  safeguard_type?: string;
  occurrenceStatus?: string;
  occurrence_status?: string;
  dueDate?: string;
  due_date?: string;
};
