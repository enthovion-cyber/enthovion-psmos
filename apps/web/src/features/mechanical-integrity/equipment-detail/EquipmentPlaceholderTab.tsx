import type { MiDetailTabKey } from '../types/equipment-detail.types';
import type { MiEquipment } from '../types/equipment.types';

export function EquipmentPlaceholderTab({ tab, equipment }: { tab: MiDetailTabKey; equipment: MiEquipment }) {
  return (
    <section className="psm-card p-6">
      <h2 className="text-lg font-semibold">{tab.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())}</h2>
      <p className="mt-2 text-sm text-[var(--psm-muted)]">Foundation panel for {equipment.tag}. This tab is intentionally structured for the next MI phase and uses real equipment context only. No fake records are shown.</p>
      <div className="mt-4 rounded-lg border border-[var(--psm-line)] p-4 text-sm">Status: foundation ready. Related counts and blockers will appear here as their backend services are enabled.</div>
    </section>
  );
}
