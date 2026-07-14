import { incidentDetailService } from './incident-detail.service';

export const incidentAssetsService = {
  tab: incidentDetailService.assetChemical,
  createEquipment: incidentDetailService.createEquipment,
  updateEquipment: incidentDetailService.updateEquipment,
  deleteEquipment: incidentDetailService.deleteEquipment,
  createChemical: incidentDetailService.createChemical,
  updateChemical: incidentDetailService.updateChemical,
  deleteChemical: incidentDetailService.deleteChemical,
  requestReview: incidentDetailService.requestAssetReview,
  approveReview: incidentDetailService.approveAssetReview,
  rejectReview: incidentDetailService.rejectAssetReview
};
