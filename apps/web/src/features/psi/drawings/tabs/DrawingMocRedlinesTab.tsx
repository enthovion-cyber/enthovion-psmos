import { MocRedlinePanel } from '../MocRedlinePanel';
import type { DrawingDetail } from '../../types/drawing.types';

export function DrawingMocRedlinesTab({ detail }: { detail: DrawingDetail }) {
  return <MocRedlinePanel value={detail.mocRedlines ?? null} />;
}
