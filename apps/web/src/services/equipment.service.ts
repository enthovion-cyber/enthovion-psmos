import { api } from './api';

export type EquipmentStatus = 'ACTIVE' | 'INACTIVE' | 'OUT_OF_SERVICE' | 'DECOMMISSIONED';
export type EquipmentCriticality = 'LOW' | 'MEDIUM' | 'HIGH' | 'SAFETY_CRITICAL';

export type EquipmentDocument = {
  id: string;
  title: string;
  documentNo?: string | null;
  documentType: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
  uploadedAt: string;
};

export type EquipmentAttachment = {
  id: string;
  title: string;
  attachmentType: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
  uploadedAt: string;
  inspectionId?: string | null;
};

export type EquipmentNote = {
  id: string;
  authorId?: string | null;
  authorName?: string | null;
  body: string;
  createdAt: string;
  updatedAt: string;
};

export type EquipmentTimelineEvent = {
  id: string;
  eventType: string;
  title: string;
  description?: string | null;
  actorName?: string | null;
  occurredAt: string;
  sourceType?: string | null;
  sourceId?: string | null;
};

export type EquipmentLinkedRecord = {
  id: string;
  moduleKey: string;
  recordType: string;
  recordId: string;
  title: string;
  status: string;
  priority?: string | null;
  url?: string | null;
};

export type EquipmentInspection = {
  id: string;
  inspectionType: string;
  inspectionDate?: string | null;
  inspector?: string | null;
  result?: string | null;
  observation?: string | null;
  status: string;
  dueDate: string;
  nextInspectionDate?: string | null;
  completedAt?: string | null;
  intervalMonths?: number | null;
  rbiPriority?: EquipmentCriticality | null;
  summary?: string | null;
  attachments?: EquipmentAttachment[];
};

export type EquipmentQrCode = {
  id: string;
  payload: string;
  label: string;
  svg?: string | null;
  storageKey?: string | null;
  generatedAt: string;
};

export type EquipmentSummary = {
  ptwOpen: number;
  mocOpen: number;
  hazopOpen: number;
  documents: number;
  actionsOpen: number;
  pssrLinked: number;
};

export type EquipmentAction = {
  id: string;
  actionNumber?: string | null;
  moduleKey: string;
  sourceType: string;
  sourceId: string;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'SAFETY_CRITICAL';
  status: 'OPEN' | 'IN_PROGRESS' | 'PENDING_VERIFICATION' | 'CLOSED' | 'CANCELLED';
  dueDate: string;
  closedAt?: string | null;
  evidenceRequired?: boolean;
  verificationRequired?: boolean;
  verifiedAt?: string | null;
  escalationLevel?: number;
  evidence?: Array<{ id: string; status: string; fileName: string; mimeType: string; storageKey: string; uploadedAt: string }>;
  createdAt: string;
  updatedAt: string;
  assignedTo?: { id: string; displayName: string; title?: string | null; department?: string | null };
  createdBy?: { id: string; displayName: string; title?: string | null; department?: string | null };
};

export type Equipment = {
  id: string;
  site?: { id: string; name: string; code: string } | null;
  unit?: { id: string; name: string; code: string } | null;
  area?: { id: string; name: string; code: string } | null;
  siteId: string;
  unitId: string;
  areaId?: string | null | undefined;
  parentId?: string | null | undefined;
  tag: string;
  name: string;
  description?: string | null;
  type: string;
  subtype?: string | null;
  manufacturer?: string | null;
  model?: string | null;
  serialNumber?: string | null;
  nameplateNumber?: string | null;
  commissionDate?: string | null;
  installationDate?: string | null;
  fabricationYear?: number | null;
  vendorSupplier?: string | null;
  warrantyExpiryDate?: string | null;
  companyName?: string | null;
  systemName?: string | null;
  buildingZone?: string | null;
  gpsLatitude?: string | number | null;
  gpsLongitude?: string | number | null;
  status: EquipmentStatus;
  criticality: EquipmentCriticality;
  safetyCritical: boolean;
  classification?: string | null;
  hazardClass?: string | null;
  areaClassification?: string | null;
  fluidName?: string | null;
  fluidService?: string | null;
  phase?: string | null;
  sdsReference?: string | null;
  exposureLimits?: string | null;
  environmentalImpact?: string | null;
  toxicityClass?: string | null;
  flammabilityClass?: string | null;
  corrosivityClass?: string | null;
  compositionNotes?: string | null;
  processChemistryNotes?: string | null;
  designPressure?: string | null;
  designPressureUnit?: string | null;
  designTemperature?: string | null;
  designTemperatureUnit?: string | null;
  designFlow?: string | null;
  designFlowUnit?: string | null;
  designCapacity?: string | null;
  designCapacityUnit?: string | null;
  materialOfConstruction?: string | null;
  corrosionAllowance?: string | null;
  designCode?: string | null;
  designBasisDocumentRef?: string | null;
  operatingPressure?: string | null;
  operatingPressureUnit?: string | null;
  operatingTemperature?: string | null;
  operatingTemperatureUnit?: string | null;
  normalFlowRate?: string | null;
  flowUnit?: string | null;
  normalCapacityLoad?: string | null;
  capacityUnit?: string | null;
  operatingMode?: string | null;
  operatingDuty?: string | null;
  serviceType?: string | null;
  fluidPhase?: string | null;
  lotoRequired?: boolean;
  confinedSpace?: boolean;
  hotWorkRestrictedArea?: boolean;
  psvProtected?: boolean;
  psvTag?: string | null;
  sisProtected?: boolean;
  sisFunctionTag?: string | null;
  esdValveAssociated?: boolean;
  esdValveTag?: string | null;
  alarmTags?: string | null;
  interlockTags?: string | null;
  hazardousAreaClassification?: string | null;
  mechanicalIntegrityCategory?: string | null;
  inspectionCategory?: string | null;
  rbiPriority?: EquipmentCriticality | null;
  maintenancePriority?: EquipmentCriticality | null;
  environmentalCriticality?: EquipmentCriticality | null;
  productionCriticality?: EquipmentCriticality | null;
  qrCodePayload: string;
  metadata?: Record<string, unknown> | null;
  children?: Equipment[];
  parent?: Equipment | null;
  relationshipsFrom?: Array<{ id: string; type: string; description?: string | null; toEquipment: Equipment }>;
  relationshipsTo?: Array<{ id: string; type: string; description?: string | null; fromEquipment: Equipment }>;
  documents?: EquipmentDocument[];
  attachments?: EquipmentAttachment[];
  notes?: EquipmentNote[];
  timelineEvents?: EquipmentTimelineEvent[];
  linkedRecords?: EquipmentLinkedRecord[];
  inspections?: EquipmentInspection[];
};

export type CreateEquipmentInput = {
  siteId: string;
  unitId: string;
  areaId?: string | null | undefined;
  parentId?: string | null | undefined;
  tag: string;
  name: string;
  type: string;
  subtype?: string | undefined;
  manufacturer?: string | undefined;
  model?: string | undefined;
  serialNumber?: string | undefined;
  nameplateNumber?: string | undefined;
  commissionDate?: string | undefined;
  installationDate?: string | undefined;
  fabricationYear?: number | undefined;
  vendorSupplier?: string | undefined;
  warrantyExpiryDate?: string | undefined;
  companyName?: string | undefined;
  systemName?: string | undefined;
  buildingZone?: string | undefined;
  gpsLatitude?: number | undefined;
  gpsLongitude?: number | undefined;
  status?: EquipmentStatus | undefined;
  criticality?: EquipmentCriticality | undefined;
  safetyCritical?: boolean | undefined;
  classification?: string | undefined;
  hazardClass?: string | undefined;
  areaClassification?: string | undefined;
  fluidName?: string | undefined;
  fluidService?: string | undefined;
  phase?: string | undefined;
  sdsReference?: string | undefined;
  exposureLimits?: string | undefined;
  environmentalImpact?: string | undefined;
  toxicityClass?: string | undefined;
  flammabilityClass?: string | undefined;
  corrosivityClass?: string | undefined;
  compositionNotes?: string | undefined;
  processChemistryNotes?: string | undefined;
  designPressure?: string | undefined;
  designPressureUnit?: string | undefined;
  designTemperature?: string | undefined;
  designTemperatureUnit?: string | undefined;
  designFlow?: string | undefined;
  designFlowUnit?: string | undefined;
  designCapacity?: string | undefined;
  designCapacityUnit?: string | undefined;
  materialOfConstruction?: string | undefined;
  corrosionAllowance?: string | undefined;
  designCode?: string | undefined;
  designBasisDocumentRef?: string | undefined;
  operatingPressure?: string | undefined;
  operatingPressureUnit?: string | undefined;
  operatingTemperature?: string | undefined;
  operatingTemperatureUnit?: string | undefined;
  normalFlowRate?: string | undefined;
  flowUnit?: string | undefined;
  normalCapacityLoad?: string | undefined;
  capacityUnit?: string | undefined;
  operatingMode?: string | undefined;
  operatingDuty?: string | undefined;
  serviceType?: string | undefined;
  fluidPhase?: string | undefined;
  lotoRequired?: boolean | undefined;
  confinedSpace?: boolean | undefined;
  hotWorkRestrictedArea?: boolean | undefined;
  psvProtected?: boolean | undefined;
  psvTag?: string | undefined;
  sisProtected?: boolean | undefined;
  sisFunctionTag?: string | undefined;
  esdValveAssociated?: boolean | undefined;
  esdValveTag?: string | undefined;
  alarmTags?: string | undefined;
  interlockTags?: string | undefined;
  hazardousAreaClassification?: string | undefined;
  mechanicalIntegrityCategory?: string | undefined;
  inspectionCategory?: string | undefined;
  rbiPriority?: EquipmentCriticality | undefined;
  maintenancePriority?: EquipmentCriticality | undefined;
  environmentalCriticality?: EquipmentCriticality | undefined;
  productionCriticality?: EquipmentCriticality | undefined;
  description?: string | undefined;
  metadata?: Record<string, unknown> | undefined;
};

export type UploadEquipmentDocumentInput = {
  title: string;
  documentNo?: string;
  documentType: string;
  file: File;
  storageKey?: string;
};

export type UploadEquipmentAttachmentInput = {
  title: string;
  attachmentType?: string;
  inspectionId?: string;
  file: File;
};

export type CreateEquipmentInspectionInput = {
  inspectionType: string;
  inspectionDate?: string;
  inspector?: string;
  result?: string;
  observation?: string;
  nextInspectionDate: string;
  status?: string;
  completedAt?: string;
  intervalMonths?: number;
  rbiPriority?: EquipmentCriticality;
  summary?: string;
};

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export const equipmentService = {
  async list(): Promise<Equipment[]> {
    return unwrap(await api.get('/equipment'));
  },
  async get(id: string): Promise<Equipment> {
    return unwrap(await api.get(`/equipment/${id}`));
  },
  async create(input: CreateEquipmentInput): Promise<Equipment> {
    return unwrap(await api.post('/equipment', input));
  },
  async createChild(id: string, input: CreateEquipmentInput): Promise<Equipment> {
    return unwrap(await api.post(`/equipment/${id}/children`, input));
  },
  async update(id: string, input: Partial<CreateEquipmentInput>): Promise<Equipment> {
    return unwrap(await api.patch(`/equipment/${id}`, input));
  },
  async documents(id: string): Promise<EquipmentDocument[]> {
    return unwrap(await api.get(`/equipment/${id}/documents`));
  },
  async uploadDocument(id: string, input: UploadEquipmentDocumentInput): Promise<EquipmentDocument> {
    const formData = new FormData();
    formData.append('title', input.title);
    formData.append('documentType', input.documentType);
    if (input.documentNo) formData.append('documentNo', input.documentNo);
    if (input.storageKey) formData.append('storageKey', input.storageKey);
    formData.append('file', input.file);
    return unwrap(await api.post(`/equipment/${id}/documents`, formData));
  },
  async replaceDocument(id: string, documentId: string, input: UploadEquipmentDocumentInput): Promise<EquipmentDocument> {
    const formData = new FormData();
    formData.append('title', input.title);
    formData.append('documentType', input.documentType);
    if (input.documentNo) formData.append('documentNo', input.documentNo);
    formData.append('file', input.file);
    return unwrap(await api.patch(`/equipment/${id}/documents/${documentId}`, formData));
  },
  async deleteDocument(id: string, documentId: string): Promise<{ id: string; deleted: boolean }> {
    return unwrap(await api.delete(`/equipment/${id}/documents/${documentId}`));
  },
  async documentFile(id: string, documentId: string): Promise<Blob> {
    const response = await api.get(`/equipment/${id}/documents/${documentId}/file`, { responseType: 'blob' });
    return response.data;
  },
  async attachments(id: string): Promise<EquipmentAttachment[]> {
    return unwrap(await api.get(`/equipment/${id}/attachments`));
  },
  async uploadAttachment(id: string, input: UploadEquipmentAttachmentInput): Promise<EquipmentAttachment> {
    const formData = new FormData();
    formData.append('title', input.title);
    if (input.attachmentType) formData.append('attachmentType', input.attachmentType);
    if (input.inspectionId) formData.append('inspectionId', input.inspectionId);
    formData.append('file', input.file);
    return unwrap(await api.post(`/equipment/${id}/attachments`, formData));
  },
  async deleteAttachment(id: string, attachmentId: string): Promise<{ id: string; deleted: boolean }> {
    return unwrap(await api.delete(`/equipment/${id}/attachments/${attachmentId}`));
  },
  async attachmentFile(id: string, attachmentId: string): Promise<Blob> {
    const response = await api.get(`/equipment/${id}/attachments/${attachmentId}/file`, { responseType: 'blob' });
    return response.data;
  },
  async linkedRecords(id: string, moduleKey?: string): Promise<EquipmentLinkedRecord[]> {
    return unwrap(await api.get(`/equipment/${id}/linked-records`, { params: { moduleKey } }));
  },
  async actions(id: string): Promise<EquipmentAction[]> {
    return unwrap(await api.get(`/equipment/${id}/actions`));
  },
  async updateActionStatus(id: string, actionId: string, status: EquipmentAction['status']): Promise<EquipmentAction> {
    return unwrap(await api.patch(`/equipment/${id}/actions/${actionId}`, { status }));
  },
  async inspections(id: string): Promise<EquipmentInspection[]> {
    return unwrap(await api.get(`/equipment/${id}/inspections`));
  },
  async createInspection(id: string, input: CreateEquipmentInspectionInput): Promise<EquipmentInspection> {
    return unwrap(await api.post(`/equipment/${id}/inspections`, input));
  },
  async updateInspection(id: string, inspectionId: string, input: Partial<CreateEquipmentInspectionInput>): Promise<EquipmentInspection> {
    return unwrap(await api.patch(`/equipment/${id}/inspections/${inspectionId}`, input));
  },
  async deleteInspection(id: string, inspectionId: string): Promise<{ id: string; deleted: boolean }> {
    return unwrap(await api.delete(`/equipment/${id}/inspections/${inspectionId}`));
  },
  async timeline(id: string): Promise<EquipmentTimelineEvent[]> {
    return unwrap(await api.get(`/equipment/${id}/timeline`));
  },
  async summary(id: string): Promise<EquipmentSummary> {
    return unwrap(await api.get(`/equipment/${id}/cross-module-summary`));
  },
  async addNote(id: string, body: string): Promise<EquipmentNote> {
    return unwrap(await api.post(`/equipment/${id}/notes`, { body }));
  },
  async updateNote(id: string, noteId: string, body: string): Promise<EquipmentNote> {
    return unwrap(await api.patch(`/equipment/${id}/notes/${noteId}`, { body }));
  },
  async deleteNote(id: string, noteId: string): Promise<{ id: string; deleted: boolean }> {
    return unwrap(await api.delete(`/equipment/${id}/notes/${noteId}`));
  },
  async generateQrCode(id: string): Promise<{ id: string; payload: string; label: string }> {
    return unwrap(await api.post(`/equipment/${id}/qr`));
  },
  async qrCode(id: string): Promise<EquipmentQrCode | null> {
    return unwrap(await api.get(`/equipment/${id}/qr`));
  }
};
