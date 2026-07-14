import { Badge } from './IncidentStatusBadge';
export function WorkflowStatusBadge({ value }: { value?: string | null }) {
  return <Badge value={value ?? 'Workflow not started'} map={{ 'Workflow in progress': 'blue', 'Workflow not started': 'slate', Complete: 'green', Closed: 'green', Escalated: 'red' }} />;
}
