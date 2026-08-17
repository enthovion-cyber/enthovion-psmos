import { AuditMappingMiniList } from './AuditMappingUi';
import type { RegulatoryAuditMappingRow } from '../types/regulatory-audit-mapping.types';

export function RegulatoryAuditMappingMobileCards({ rows }: { rows?: RegulatoryAuditMappingRow[] | undefined }) {
  return <div className="lg:hidden"><AuditMappingMiniList rows={rows} /></div>;
}
