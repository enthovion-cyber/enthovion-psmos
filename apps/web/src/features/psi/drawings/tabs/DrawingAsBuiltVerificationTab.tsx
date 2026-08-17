import { AsBuiltVerificationPanel } from '../AsBuiltVerificationPanel';
import type { DrawingDetail } from '../../types/drawing.types';

export function DrawingAsBuiltVerificationTab({ detail }: { detail: DrawingDetail }) {
  return <AsBuiltVerificationPanel rows={detail.asBuiltVerifications} />;
}
