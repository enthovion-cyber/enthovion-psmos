import { InfoPanel } from '../MaterialCompatibilityPrimitives';
import type { MaterialCompatibilityDetail } from '../../types/material-compatibility.types';

export function CompatibilityEvidenceDocumentsTab({ detail }: { detail: MaterialCompatibilityDetail }) {
  return <InfoPanel title="Evidence / Documents" subtitle="Document Control links and snapshots for compatibility charts, SDS, vendor data, corrosion studies, metallurgy, MI inspection, MOC, PSSR, and standards." rows={detail.documents} emptyTitle="No evidence linked" emptyMessage="No controlled document links were returned by the backend." />;
}

