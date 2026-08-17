export function validateWorkOrderExecution(input: Record<string, unknown>) {
  return ['completionNotes', 'result'].filter((field) => !input[field]);
}
