export function validateAuditCapaAction(input: Record<string, any>) {
  return [
    !input.actionTitle ? "Action title is required." : "",
    !input.actionType ? "Action type is required." : "",
    !input.ownerUserId ? "Action owner is required." : "",
    !input.dueDate ? "Action due date is required." : "",
    !input.priority ? "Action priority is required." : "",
  ].filter(Boolean);
}
