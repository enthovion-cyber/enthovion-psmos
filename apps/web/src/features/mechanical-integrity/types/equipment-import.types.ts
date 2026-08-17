export type MiEquipmentImportRow = {
  rowNumber: number;
  raw: Record<string, unknown>;
  normalized?: Record<string, unknown>;
  status: 'Pending' | 'Valid' | 'Error' | 'Committed';
  errors: string[];
};

export type MiEquipmentImportJob = {
  id: string;
  fileName: string;
  status: string;
  totalRows: number;
  validRows: number;
  errorRows: number;
  createdEquipmentCount: number;
  rows?: MiEquipmentImportRow[];
};
