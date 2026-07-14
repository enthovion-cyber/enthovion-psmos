import { incidentCapaService } from './incident-capa.service';

export const incidentCapaGenerationService = {
  generateFromRca: incidentCapaService.generateFromRca,
  generateFromBarriers: incidentCapaService.generateFromBarriers
};
