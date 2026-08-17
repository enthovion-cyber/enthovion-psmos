import { RunawayHazardPanel } from '../panels/RunawayHazardPanel';
import type { ProcessChemistryDetail } from '../../types/process-chemistry.types';

export function ReactionHazardsTab({ detail }: { detail: ProcessChemistryDetail }) {
  return <RunawayHazardPanel chemistry={detail.chemistry} hazards={detail.hazards} />;
}
