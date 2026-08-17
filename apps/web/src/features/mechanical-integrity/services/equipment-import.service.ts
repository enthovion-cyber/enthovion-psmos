import type { MiEquipmentImportJob } from '../types/equipment-import.types';

export const miEquipmentImportService = {
  templateColumns: [
    'equipment_tag', 'equipment_name', 'description', 'equipment_type', 'equipment_category', 'site', 'department', 'process_unit', 'area', 'manufacturer', 'model', 'serial_number', 'asset_number', 'installation_date', 'status', 'design_pressure', 'design_temperature', 'operating_pressure', 'operating_temperature', 'material_of_construction', 'service_fluid', 'critical_equipment', 'safety_critical_equipment', 'psm_critical', 'inspection_required', 'inspection_frequency', 'pm_required', 'pm_frequency', 'calibration_required', 'calibration_frequency'
  ],
  emptyJob(): MiEquipmentImportJob {
    return { id: 'not-started', fileName: '', status: 'Not started', totalRows: 0, validRows: 0, errorRows: 0, createdEquipmentCount: 0 };
  }
};
