export type HazopLinkedRecordFilters = {
  search?: string;
  module?: string;
  relationshipType?: string;
  blockingStatus?: string;
};

export type HazopLinkedRecord = {
  id: string;
  linked_module?: string;
  linked_record_type?: string;
  linked_record_id?: string;
  linked_record_number?: string;
  linked_record_title?: string;
  relationship_type?: string;
  dependency_direction?: string;
  blocking_rule?: string;
  blocking_status?: string;
  link_reason?: string;
  notes?: string;
  record_status?: string;
  equipment_tag?: string;
  document_version?: string;
  last_synced_at?: string;
  restricted?: boolean;
  url?: string | null;
  blockers?: HazopLinkedRecordBlocker[];
};

export type HazopLinkedRecordBlocker = {
  id: string;
  linked_record_id?: string;
  blocker_type: string;
  blocker_description?: string;
  severity?: string;
  status?: string;
  source_status?: string;
};

export type HazopLinkedRecordSummary = {
  totalLinkedRecords: number;
  linkedMocs: number;
  linkedPssrs: number;
  linkedEquipment: number;
  linkedDocuments: number;
  linkedActions: number;
  linkedIncidentsAudits: number;
  openBlockers: number;
  outdatedDocuments: number;
  lopaRequiredPending: number;
  recordsNeedingReview: number;
};

export type HazopLinkedRecordContext = {
  modules: string[];
  relationshipTypes: string[];
  dependencyDirections: string[];
  blockingRules: string[];
};
