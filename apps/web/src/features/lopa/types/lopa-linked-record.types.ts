export type LopaLinkedRecordFilters = {
  q?: string | undefined;
  recordType?: string | undefined;
  sourceModule?: string | undefined;
  relationshipType?: string | undefined;
  required?: string | boolean | undefined;
  blocking?: string | boolean | undefined;
  sourceChanged?: string | boolean | undefined;
  accessStatus?: string | undefined;
  quick?: string | undefined;
};

export type LopaLinkedRecordInput = {
  recordType: string;
  sourceModule: string;
  sourceRecordId: string;
  recordNumber?: string | undefined;
  recordTitle?: string | undefined;
  relationshipType: string;
  required?: boolean | undefined;
  blocking?: boolean | undefined;
  sourceStatus?: string | undefined;
  sourceSnapshot?: Record<string, unknown> | undefined;
  impactLevel?: string | undefined;
  notes?: string | undefined;
  linkReason?: string | undefined;
};

export type LopaLinkedRecordsTabData = {
  readOnly: boolean;
  header: Record<string, any>;
  summary: Record<string, any>;
  relationshipMap: any[];
  records: { rows: any[]; total: number; page: number; limit: number };
  required: any;
  dependencies: any[];
  evidence: any[];
  context: Record<string, any>;
};
