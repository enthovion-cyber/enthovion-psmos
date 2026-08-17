export const auditScoreRunSchema = {
  required: ["sourceObjectType", "sourceObjectId"],
  fields: ["scoreCode", "scoreTitle", "modelId", "sourceObjectType", "sourceObjectId", "siteId", "unitId", "areaId", "programId", "planId", "executionId", "checklistId", "findingId", "capaId"],
};
