'use client';

import { DocSection } from './shared';

export function SOPProcedureReadinessSection({ rows }: { rows: any[] }) {
  return <DocSection title="SOP / Procedure Readiness Section" rows={rows} types={['SOP', 'Operating procedure', 'Emergency procedure', 'Startup procedure', 'Shutdown procedure', 'Maintenance procedure']} details={['Affected SOPs', 'Operating procedures', 'Emergency procedures', 'Startup/shutdown procedures', 'Maintenance procedures', 'LOTO procedures', 'Control room instructions']} />;
}
