import { api } from '@/services/api';

export const miEquipmentExportService = {
  async registryCsv(params: Record<string, unknown> = {}) {
    const response = await api.get('/mechanical-integrity/equipment/export', { params, responseType: 'blob' });
    return response.data as Blob;
  },
  async summaryCsv(id: string) {
    const response = await api.get(`/mechanical-integrity/equipment/${id}/export-summary`, { responseType: 'blob' });
    return response.data as Blob;
  }
};
