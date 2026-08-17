export function validateChecklist(value: Record<string, unknown>) {
  return [
    "checklistTitle",
    "checklistCode",
    "templateType",
    "auditType",
    "criticality",
  ].filter((key) => !String(value[key] ?? "").trim());
}
