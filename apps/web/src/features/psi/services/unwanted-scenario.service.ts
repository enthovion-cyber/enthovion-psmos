import { processChemistryService } from './process-chemistry.service';

export const unwantedScenarioService = {
  list: processChemistryService.scenarios,
  save: processChemistryService.saveScenario,
  remove: processChemistryService.removeScenario
};
