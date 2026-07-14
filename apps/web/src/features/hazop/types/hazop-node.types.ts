export type HazopNodeStatus =
  | "Draft"
  | "In Progress"
  | "Under Review"
  | "Reviewed"
  | "Completed"
  | "Approved"
  | "Needs Rework"
  | "Closed"
  | "Archived";

export type HazopNodeEquipmentLink = {
  id: string;
  tag?: string;
  equipmentTag?: string;
  name?: string;
  equipmentName?: string;
  type?: string;
  equipmentType?: string;
  criticality?: string;
  status?: string;
  siteId?: string;
  unitId?: string;
  areaId?: string;
};

export type HazopNodeDocumentLink = {
  id: string;
  document_number?: string;
  documentNumber?: string;
  title?: string;
  document_type?: string;
  documentType?: string;
  revision?: string;
  version?: string;
  status?: string;
  effective_date?: string;
  effectiveDate?: string;
};

export type HazopNodeParameterConfiguration = {
  parameterName: string;
  category?: string;
  normalOperatingRange?: string;
  designRange?: string;
  unitOfMeasurement?: string;
  highLimit?: string;
  lowLimit?: string;
  relatedEquipmentId?: string;
  relatedDocumentId?: string;
  safetyConcern?: string;
  notes?: string;
  isCustom?: boolean;
};

export type HazopNodeListItem = {
  id: string;
  node_number?: string;
  nodeNumber?: string;
  title?: string;
  description?: string;
  design_intent?: string;
  owner_id?: string;
  complex_id?: string;
  site_id?: string;
  unit_id?: string;
  area_id?: string;
  process_section?: string;
  equipmentLabel?: string;
  equipment_ids?: string[];
  status?: HazopNodeStatus | string;
  document_ids?: string[];
  pid_references?: string[];
  boundaries?: string;
  boundary_limits?: string;
  assumptions?: string;
  exclusions?: string;
  normal_operating_conditions?: string;
  process_conditions?: string;
  process_conditions_json?: Record<string, unknown>;
  selected_parameters?: string[];
  parameter_configurations?: HazopNodeParameterConfiguration[];
  equipment_link_snapshots?: HazopNodeEquipmentLink[];
  document_version_snapshots?: HazopNodeDocumentLink[];
  equipmentLinks?: HazopNodeEquipmentLink[];
  documentLinks?: HazopNodeDocumentLink[];
  parameterRows?: HazopNodeParameterConfiguration[];
  scenarioCount?: number;
  highRiskCount?: number;
  openRecommendationCount?: number;
  lopaRequiredCount?: number;
  completionPercent?: number;
  highestRisk?: string | null;
};
