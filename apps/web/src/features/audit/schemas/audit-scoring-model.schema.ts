export const auditScoringModelSchema = {
  required: ["modelTitle", "modelType", "methodologyVersion"],
  fields: ["modelCode", "modelTitle", "modelType", "description", "methodologyVersion", "modelStatus", "effectiveDate", "ownerUserId", "reviewerUserId", "applicableScope", "applicableAuditTypes", "applicableModules", "applicableStandards", "defaultModel"],
};
