import { PsiCard, PsiEmptyState } from '../../shared/PsiUi';
import type { ReliefSystemDetail } from '../../types/relief-system.types';
import { ReliefSystemFieldGrid, valueOf } from '../ReliefSystemFieldGrid';

export function ProtectedEquipmentTab({ detail }: { detail: ReliefSystemDetail }) {
  const rows = detail.protectedEquipment;
  return (
    <PsiCard title="Protected Equipment" subtitle="Equipment Registry link, protected item status, design basis cross-check, isolation, relief path, and safety-critical ownership.">
      {!rows.length ? <PsiEmptyState title="No protected equipment linked" message="Link protected equipment before relief basis approval." /> : (
        <div className="space-y-4">{rows.map((row) => <ReliefSystemFieldGrid key={String(row.id ?? row.equipment_id)} items={[
          { label: 'Equipment ID', value: valueOf(row, 'equipment_id') },
          { label: 'Equipment tag', value: valueOf(row, 'equipment_tag') },
          { label: 'Equipment name', value: valueOf(row, 'equipment_name') },
          { label: 'Equipment role', value: valueOf(row, 'equipment_role') },
          { label: 'Equipment design basis', value: valueOf(row, 'equipment_design_basis_id'), tone: row.equipment_design_basis_id ? 'normal' : 'warn' },
          { label: 'Isolation status', value: valueOf(row, 'isolation_status') },
          { label: 'Relief path', value: valueOf(row, 'relief_path_description') },
          { label: 'Safety critical', value: valueOf(row, 'safety_critical') },
          { label: 'PSM critical', value: valueOf(row, 'psm_critical') }
        ]} />)}</div>
      )}
    </PsiCard>
  );
}
