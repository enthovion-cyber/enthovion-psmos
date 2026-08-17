import { equipmentDesignService } from './equipment-design.service';

export const equipmentDesignCompletenessService = {
  run: (designBasisId: string) => equipmentDesignService.runCompleteness(designBasisId)
};
