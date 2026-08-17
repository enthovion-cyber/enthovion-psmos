import { equipmentDesignService } from './equipment-design.service';

export const equipmentDesignSyncService = {
  diff: (designBasisId: string) => equipmentDesignService.miDiff(designBasisId),
  compareOnly: (designBasisId: string) => equipmentDesignService.compareOnly(designBasisId),
  fromMi: (designBasisId: string, input: Record<string, unknown>) => equipmentDesignService.syncFromMi(designBasisId, input),
  toMi: (designBasisId: string, input: Record<string, unknown>) => equipmentDesignService.syncToMi(designBasisId, input)
};
