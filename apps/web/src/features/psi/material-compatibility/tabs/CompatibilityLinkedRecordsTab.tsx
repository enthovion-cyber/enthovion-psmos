import { InfoPanel } from '../MaterialCompatibilityPrimitives';
import type { MaterialCompatibilityDetail } from '../../types/material-compatibility.types';

export function CompatibilityLinkedRecordsTab({ detail }: { detail: MaterialCompatibilityDetail }) {
  return <InfoPanel title="Linked Records" subtitle="Connected PSI, Chemical/SDS, Equipment Design Basis, Mechanical Integrity, MOC, PSSR, HAZOP/PHA, LOPA/SIL, PTW, Audit, and Action Engine references returned by the backend." rows={detail.linkedRecords} emptyTitle="No linked records returned" emptyMessage="Backend found no cross-module linked records for this material compatibility record." />;
}

