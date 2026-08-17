import { equipmentDesignService } from './equipment-design.service';

export const equipmentDesignConflictService = {
  run: (designBasisId: string) => equipmentDesignService.runConflictCheck(designBasisId),
  override: (designBasisId: string, conflictId: string, input: Record<string, unknown>) => equipmentDesignService.overrideConflict(designBasisId, conflictId, input)
};
