export type MiCml = {
  id: string;
  equipment_id?: string;
  cml_number?: string;
  cmlNumber?: string;
  cml_type?: string;
  cmlType?: string;
  component_type?: string | null;
  location_description?: string | null;
  damage_mechanism?: string | null;
  inspection_method?: string | null;
  nominal_thickness?: number | string | null;
  minimum_required_thickness?: number | string | null;
  retirement_thickness?: number | string | null;
  thickness_unit?: string | null;
  status?: string | null;
  criticality?: string | null;
  latestThickness?: number | string | null;
  latestReadingDate?: string | null;
  governingCorrosionRate?: number | string | null;
  remainingLifeYears?: number | string | null;
  nextDueDate?: string | null;
  alertStatus?: string | null;
  calculationStatus?: string | null;
  readings?: MiCmlReading[];
  calculation?: MiCmlCalculation | null;
};

export type MiCmlReading = {
  id: string;
  reading_date?: string;
  thickness_value?: number | string;
  thickness_unit?: string;
  inspection_method?: string | null;
  review_status?: string | null;
  status?: string | null;
  notes?: string | null;
};

export type MiCmlCalculation = {
  calculation_status?: string;
  latest_thickness?: number | string | null;
  latest_reading_date?: string | null;
  short_term_corrosion_rate?: number | string | null;
  long_term_corrosion_rate?: number | string | null;
  governing_corrosion_rate?: number | string | null;
  remaining_life_years?: number | string | null;
  next_due_date?: string | null;
  next_due_basis?: string | null;
  alert_status?: string | null;
  methodology_json?: Record<string, unknown>;
};

export type MiCmlRegistryResponse = {
  rows: MiCml[];
  summary: Record<string, unknown>;
  alerts: Array<Record<string, unknown>>;
};
