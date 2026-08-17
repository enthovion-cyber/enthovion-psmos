import { ChemicalsRolesSection } from '../sections/ChemicalsRolesSection';
import type { ProcessChemistryDetail } from '../../types/process-chemistry.types';

export function ChemicalsRolesTab({ detail }: { detail: ProcessChemistryDetail }) {
  return <ChemicalsRolesSection roles={detail.roles} />;
}
