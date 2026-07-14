'use client';

import { DocSection } from './shared';

export function EmergencyOperatingLimitDocumentReadiness({ rows }: { rows: any[] }) {
  return <DocSection title="Emergency / Operating Limit Document Readiness" rows={rows} types={['Operating limits', 'Emergency procedure']} details={['Operating limits register', 'Alarm/interlock list', 'Temporary operating instruction', 'Emergency procedure', 'Startup communication document']} />;
}
