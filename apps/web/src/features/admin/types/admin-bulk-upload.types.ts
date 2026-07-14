import type { CreateUserInput } from '@/services/iam.service';

export type AdminBulkUserRow = CreateUserInput & {
  rowNumber?: number;
  validationStatus?: string;
  validationErrors?: string[];
};
