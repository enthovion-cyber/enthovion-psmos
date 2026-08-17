import type { Equipment } from '@/services/equipment.service';

export type MiTone = 'neutral' | 'warning' | 'danger';

export type MiKpi = {
  label: string;
  value: number | string;
  helper?: string;
  tone?: MiTone;
};

export type MiDistributionPoint = {
  label: string;
  count: number;
};

export type MiAttentionItem = {
  equipmentId: string;
  equipmentTag: string;
  equipmentName: string;
  site?: string | null;
  unit?: string | null;
  area?: string | null;
  issueType: string;
  severity: string;
  dueDate?: string | null;
  href: string;
};

export type MiEquipment = Equipment & {
  companyId?: string | null;
  createdAt?: string | null;
  created_at?: string | null;
  updatedAt?: string | null;
  updated_at?: string | null;
  ownerDepartmentId?: string | null;
  custodianUserId?: string | null;
  fitnessStatus?: string | null;
  readinessStatus?: string | null;
  inspectionStatus?: string | null;
  pmStatus?: string | null;
  calibrationStatus?: string | null;
  startupBlocked?: boolean | null;
  startupBlockReason?: string | null;
  restrictionsSummary?: string | null;
  bypassActive?: boolean | null;
  bypassRiskLevel?: string | null;
  activeImpairmentCount?: number | null;
  expiredImpairmentCount?: number | null;
  safetyCriticalImpairmentCount?: number | null;
  nextImpairmentExpiryAt?: string | null;
  openDeficiencyCount?: number | null;
  criticalDeficiencyCount?: number | null;
  linkedPsmRecordsCount?: number | null;
  nextInspectionDueDate?: string | null;
  nextPmDueDate?: string | null;
  nextCalibrationDueDate?: string | null;
  inspectionRequired?: boolean | null;
  pmRequired?: boolean | null;
  calibrationRequired?: boolean | null;
  cmlCount?: number | null;
  activeCmlCount?: number | null;
  lastUtReadingDate?: string | null;
  minimumRemainingLife?: string | number | null;
  highestCorrosionRate?: string | number | null;
  cmlAlertCount?: number | null;
  cmlOverdueCount?: number | null;
  nextCmlInspectionDue?: string | null;
  proofTestRequired?: boolean | null;
  isSafeguard?: boolean | null;
  isIplCandidate?: boolean | null;
  safeguardType?: string | null;
  psmCritical?: boolean | null;
};

export type MiRegistryResponse = {
  rows: MiEquipment[];
  page: number;
  limit: number;
  total: number;
  summary: MiKpi[];
  savedViews: string[];
  lastUpdated: string;
};

export type MiEquipmentTechnicalData = {
  identification: Record<string, unknown>;
  location: Record<string, unknown>;
  designData: Record<string, unknown>;
  operatingData: Record<string, unknown>;
  materialsCorrosion: Record<string, unknown>;
  processFluidChemical: Record<string, unknown>;
  geometryDimensions?: Record<string, unknown>;
  codeStandardRating?: Record<string, unknown>;
  reliefProtectionData?: Record<string, unknown>;
  drawingsReferences?: Record<string, unknown>;
  safetyCriticalAttributes: Record<string, unknown>;
  completeness?: Record<string, unknown>;
  revisionMetadata?: Record<string, unknown> | null;
};

export type MiEquipmentOverview = {
  equipment: MiEquipment;
  snapshot: Record<string, unknown>;
  statusCards: MiEquipmentStatusItem[];
  technicalSummary: MiEquipmentTechnicalData;
  criticalitySummary: Record<string, unknown>;
  scheduleSummary: Record<string, unknown>;
  cmlSummary: Record<string, unknown>;
  safeguardSummary: Record<string, unknown>;
  bypassSummary: Record<string, unknown>;
  deficiencySummary: Record<string, unknown>;
  readinessSummary: Record<string, unknown>;
  linkedRecordsSummary: Record<string, unknown>;
  documentsSummary: Record<string, unknown>;
  recentActivity: Array<Record<string, unknown>>;
  blockers?: MiEquipmentBlocker[];
};

export type MiEquipmentStatusItem = {
  label: string;
  value: string;
  tab: string;
  tone: 'success' | 'warning' | 'danger' | 'neutral';
  reason?: string | null;
};

export type MiEquipmentAction = {
  key: string;
  label: string;
  permitted: boolean;
  disabled: boolean;
  disabledReason?: string | null;
};

export type MiEquipmentHeader = {
  equipment: MiEquipment;
  statusSummary: MiEquipmentStatusItem[];
  readOnly: boolean;
  readOnlyReason?: string | null;
  actions: MiEquipmentAction[];
  lastUpdated?: string | null;
  createdAt?: string | null;
};

export type MiEquipmentBlocker = {
  id: string;
  type: string;
  category: string;
  severity: string;
  sourceSection: string;
  reason: string;
  owner?: string | null;
  dueDate?: string | null;
  href: string;
  recommendedNextAction: string;
};
