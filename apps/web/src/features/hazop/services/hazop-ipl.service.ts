import { api } from '@/services/api';
import { hazopIplValidationSchema } from '../schemas/hazop-ipl.schema';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export const hazopIplService = {
  getValidation: (studyId: string, safeguardId: string) => api.get(`/hazop/${studyId}/safeguards/${safeguardId}/ipl-validation`).then(unwrap<any>),
  createValidation: (studyId: string, safeguardId: string, values: Record<string, any>) => api.post(`/hazop/${studyId}/safeguards/${safeguardId}/ipl-validation`, hazopIplValidationSchema.parse(values)).then(unwrap<any>),
  updateValidation: (studyId: string, safeguardId: string, validationId: string, values: Record<string, any>) => api.patch(`/hazop/${studyId}/safeguards/${safeguardId}/ipl-validation/${validationId}`, hazopIplValidationSchema.parse(values)).then(unwrap<any>),
  finalizeValidation: (studyId: string, safeguardId: string, validationId: string) => api.post(`/hazop/${studyId}/safeguards/${safeguardId}/ipl-validation/${validationId}/finalize`).then(unwrap<any>)
};
