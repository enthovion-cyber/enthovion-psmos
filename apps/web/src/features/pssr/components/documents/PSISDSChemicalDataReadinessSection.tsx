'use client';

import { DocSection } from './shared';

export function PSISDSChemicalDataReadinessSection({ rows }: { rows: any[] }) {
  return <DocSection title="PSI / SDS / Chemical Data Readiness" rows={rows} types={['SDS', 'PSI chemical data']} details={['SDS updates', 'PSI chemical register', 'Exposure limits', 'Chemical hazard data', 'Compatibility review documents', 'Environmental/waste documents']} />;
}
