import { processChemistryService } from './process-chemistry.service';

export const processChemistryCompletenessService = {
  run: processChemistryService.runCompleteness
};
