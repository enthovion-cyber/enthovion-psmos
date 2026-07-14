import { Badge } from './IncidentStatusBadge';
export function ESignatureStatusBadge({ value, required }: { value?: string | null; required?: boolean }) {
  return <Badge value={value ?? (required ? 'Signature required' : 'Not required')} map={{ Signed: 'green', 'Signature required': 'amber', Missing: 'red', 'Not required': 'slate' }} />;
}
