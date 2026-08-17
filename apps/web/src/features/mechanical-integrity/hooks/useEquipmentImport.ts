'use client';

import { miEquipmentImportService } from '../services/equipment-import.service';

export function useEquipmentImport() {
  return { templateColumns: miEquipmentImportService.templateColumns, emptyJob: miEquipmentImportService.emptyJob() };
}
