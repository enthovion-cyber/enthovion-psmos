import { ControlsSafeguardsSection } from '../sections/ControlsSafeguardsSection';
import type { ProcessChemistryDetail } from '../../types/process-chemistry.types';

export function ControlsSafeguardsTab({ detail }: { detail: ProcessChemistryDetail }) {
  return <ControlsSafeguardsSection controls={detail.controls} />;
}
