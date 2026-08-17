import { ChemistryDocumentsSection } from '../sections/ChemistryDocumentsSection';
import type { ProcessChemistryDetail } from '../../types/process-chemistry.types';

export function ChemistryDocumentsTab({ detail }: { detail: ProcessChemistryDetail }) {
  return <ChemistryDocumentsSection documents={detail.documents} />;
}
