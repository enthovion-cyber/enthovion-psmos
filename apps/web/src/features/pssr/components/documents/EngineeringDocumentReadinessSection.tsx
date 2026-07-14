'use client';

import { DocSection } from './shared';

export function EngineeringDocumentReadinessSection({ rows }: { rows: any[] }) {
  return <DocSection title="Engineering Document Readiness" rows={rows} types={['Design basis', 'Equipment datasheet', 'Cause & effect', 'Loop drawing', 'Electrical single line drawing', 'Hazardous area classification drawing']} details={['Design basis', 'Datasheets', 'Calculations', 'Vendor documents', 'Hazardous area drawings', 'Cause & effect', 'SIS/DCS logic', 'Relief calculations', 'Loop drawings', 'Electrical drawings']} />;
}
