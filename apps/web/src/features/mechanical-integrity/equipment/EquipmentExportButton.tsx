import { Download } from 'lucide-react';

export function EquipmentExportButton({ href = '/api/v1/mechanical-integrity/equipment/export' }: { href?: string }) {
  return <a className="psm-button psm-button-secondary" href={href}><Download size={16} /> Export</a>;
}
