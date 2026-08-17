export const trainingEvidenceTypes = ['Attendance sheet', 'Certificate', 'Assessment result', 'Practical demonstration', 'Supervisor sign-off', 'HSE sign-off', 'SOP acknowledgement', 'Document Control', 'External provider record', 'Other'] as const;

export function validateTrainingRecordEvidence(value: Record<string, any>) {
  const missing = [];
  if (!value.evidenceType && !value.evidence_type) missing.push('evidenceType');
  if (!value.documentId && !value.document_id && !value.storageObjectPath && !value.storage_object_path) missing.push('controlledDocumentOrStorageObject');
  return missing;
}
