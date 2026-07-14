'use client';

import { DocSection } from './shared';

export function PIDReadinessSection({ rows }: { rows: any[] }) {
  return <DocSection title="P&ID Readiness Section" rows={rows} types={['P&ID']} details={['Affected P&IDs', 'Redline status', 'Revision status', 'Document Control approval status', 'Field verification matched to P&ID', 'Current approved version', 'Required version']} />;
}
