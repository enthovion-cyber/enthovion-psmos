export const auditScoringRuleSchema = {
  required: ["ruleTitle", "ruleType", "ruleCategory", "appliesTo"],
  fields: ["ruleCode", "ruleTitle", "ruleType", "ruleCategory", "appliesTo", "ruleOrder", "weight", "points", "penalty", "multiplier", "capScore", "failCondition", "condition", "calculation", "explanationTemplate", "active"],
};
