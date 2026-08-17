export function validateMocTrainingAssignment(values: Record<string, any>) {
  const errors: string[] = [];
  if (!String(values.workerId ?? values.worker_id ?? '').trim()) errors.push('Worker');
  if (!String(values.requirementId ?? values.requirement_id ?? '').trim()) errors.push('Requirement');
  if ((values.dueDateRequired ?? values.due_date_required) && !String(values.dueDate ?? values.due_date ?? '').trim()) errors.push('Due date');
  return errors;
}
