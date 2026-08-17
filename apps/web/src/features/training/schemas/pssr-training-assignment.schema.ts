export function validatePssrTrainingAssignment(values: Record<string, any>) {
  const errors: string[] = [];
  if (!String(values.workerId ?? values.worker_id ?? '').trim()) errors.push('Worker');
  if (!String(values.readinessId ?? values.readiness_id ?? '').trim()) errors.push('Readiness');
  if ((values.dueDateRequired ?? values.due_date_required) && !String(values.dueDate ?? values.due_date ?? '').trim()) errors.push('Due date');
  return errors;
}

