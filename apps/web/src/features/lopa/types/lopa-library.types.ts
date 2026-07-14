export type LopaLibrarySummary = {
  total: number;
  active: number;
  draft: number;
  pendingApproval: number;
  approved: number;
  archived: number;
  corporate: number;
  siteSpecific: number;
  withUncertaintyRange: number;
  needingReview: number;
  missingSourceReference: number;
};

export type LopaLibraryResponse<T> = { rows: T[]; total: number; page: number; limit: number };

export type InitiatingEventLibraryRecord = {
  id: string;
  event_code: string;
  event_name: string;
  description?: string | null;
  event_category: string;
  failure_mode?: string | null;
  equipment_type?: string | null;
  subtype?: string | null;
  service_application?: string | null;
  base_frequency: number;
  frequency_unit: string;
  low_frequency?: number | null;
  high_frequency?: number | null;
  confidence_level?: string | null;
  source_type: string;
  source_reference: string;
  standard_reference?: string | null;
  applicability_notes?: string | null;
  exclusion_notes?: string | null;
  scope: string;
  site_id?: string | null;
  site_modifier_allowed: boolean;
  default_site_modifier: number;
  engineering_justification_required: boolean;
  engineering_justification?: string | null;
  approval_status: string;
  revision: number;
  revision_notes?: string | null;
  active: boolean;
  updated_at?: string;
};

export type ConditionalModifierLibraryRecord = {
  id: string;
  modifier_code: string;
  modifier_name: string;
  description?: string | null;
  modifier_type: string;
  application_context?: string | null;
  default_value: number;
  low_value?: number | null;
  high_value?: number | null;
  unit?: string | null;
  confidence_level?: string | null;
  source_type: string;
  source_reference: string;
  standard_reference?: string | null;
  applicability_notes?: string | null;
  exclusion_notes?: string | null;
  scope: string;
  site_id?: string | null;
  override_allowed: boolean;
  engineering_justification_required: boolean;
  engineering_justification?: string | null;
  approval_status: string;
  revision: number;
  revision_notes?: string | null;
  active: boolean;
  updated_at?: string;
};

export type LibraryFilters = Record<string, string | number | boolean | undefined>;
