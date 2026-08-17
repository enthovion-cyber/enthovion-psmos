import { Archive, FileText, Link2, MoreHorizontal, Pencil, Plus, RotateCcw, ShieldAlert } from 'lucide-react';
import type { MiEquipmentAction } from '../types/equipment.types';

const iconMap: Record<string, typeof Pencil> = {
  edit: Pencil,
  'status-change': ShieldAlert,
  'add-linked-record': Link2,
  'add-document': FileText,
  'create-action': Plus,
  'create-deficiency': Plus,
  'inspection-plan': FileText,
  export: FileText,
  history: MoreHorizontal,
  archive: Archive,
  reactivate: RotateCcw
};

export function EquipmentDetailActions({ actions, onAction }: { actions: MiEquipmentAction[]; onAction: (key: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => {
        const Icon = iconMap[action.key] ?? MoreHorizontal;
        return (
          <button
            key={action.key}
            type="button"
            title={action.disabled ? action.disabledReason ?? 'Action disabled' : action.label}
            disabled={action.disabled}
            onClick={() => onAction(action.key)}
            className="psm-button psm-button-secondary disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Icon size={16} /> {action.label}
          </button>
        );
      })}
    </div>
  );
}
