export type LopaSilData = {
  readOnly: boolean;
  header: Record<string, any>;
  summary: Record<string, any>;
  riskCalculation?: Record<string, any> | null;
  determination?: Record<string, any> | null;
  sifs: Record<string, any>[];
  components: Record<string, any>[];
  architectures: Record<string, any>[];
  proofTests: Record<string, any>[];
  gaps: Record<string, any>[];
  links: Record<string, any>[];
  actions: Record<string, any>[];
  snapshots: Record<string, any>[];
  reassessments: Record<string, any>[];
  readiness: { status?: string; percent?: number; checks?: Record<string, any>[]; blockers?: Record<string, any>[] };
  methodology: Record<string, any> | null;
  context: Record<string, any>;
};

export type LopaSilActionInput = { reason?: string; notes?: string; methodologyReference?: string; targetSil?: string; status?: string; existingSifId?: string; existingSifAdequate?: boolean; newSifRequired?: boolean };
export type LopaSifInput = Record<string, unknown> & { title: string; sifTag?: string; safetyFunction?: string; complete?: boolean };
export type LopaSifComponentInput = Record<string, unknown> & { componentType: string };
export type LopaSilLinkInput = { linkedRecordType: string; linkedRecordId: string; linkedRecordNumber?: string; linkedRecordTitle?: string; sourceModule?: string; relationship?: string; required?: boolean; sifSpecificationId?: string };
export type LopaSilActionCreateInput = { title: string; description: string; ownerId: string; priority: string; dueDate: string; sourceType?: string; sourceRecordId?: string; sifSpecificationId?: string; blocking?: boolean };
