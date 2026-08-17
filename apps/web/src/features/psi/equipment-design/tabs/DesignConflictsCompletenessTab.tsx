import { EquipmentDesignCompletenessPanel } from '../EquipmentDesignCompletenessPanel';
import { EquipmentDesignConflictPanel } from '../EquipmentDesignConflictPanel';
import { MiSyncDiffPanel } from '../MiSyncDiffPanel';
import type { EquipmentDesignDetail } from '../../types/equipment-design.types';

export function DesignConflictsCompletenessTab({ detail }: { detail: EquipmentDesignDetail }) {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <EquipmentDesignCompletenessPanel checks={detail.completeness} />
      <EquipmentDesignConflictPanel conflicts={detail.conflicts} />
      <div className="xl:col-span-2"><MiSyncDiffPanel syncEvents={detail.syncEvents} /></div>
    </div>
  );
}
