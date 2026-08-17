import type { ElectricalDetail } from '../../types/electrical-classification.types';
import { ElectricalRatingCheckPanel } from '../ElectricalRatingCheckPanel';

export function InstalledEquipmentRatingTab({ detail }: { detail: ElectricalDetail }) {
  return <ElectricalRatingCheckPanel items={detail.installedEquipment} />;
}
