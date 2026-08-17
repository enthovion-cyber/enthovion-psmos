import type { SafeguardDetail } from '../../types/safeguard.types';
import { SafeguardEffectivenessPanel } from '../SafeguardEffectivenessPanel';

export function SafeguardEffectivenessTab({ detail }: { detail: SafeguardDetail }) {
  return <SafeguardEffectivenessPanel effectiveness={detail.effectiveness} />;
}
