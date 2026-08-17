export const auditScoreAdjustmentSchema = {
  required: ["adjustmentType", "adjustedValue", "adjustmentReason"],
  fields: ["adjustmentType", "adjustmentValue", "originalValue", "adjustedValue", "relatedSourceModule", "relatedSourceRecordId", "adjustmentReason", "riskComplianceJustification"],
};
