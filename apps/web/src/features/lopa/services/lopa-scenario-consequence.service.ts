import { api } from '@/services/api';
import type { LopaScenarioConsequence, LopaScenarioContext, LopaScenarioUpdate } from '../types/lopa-scenario-consequence.types';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export const lopaScenarioConsequenceService = {
  context: (id: string) => api.get(`/lopa/${id}/scenario-consequence/context`).then(unwrap<LopaScenarioContext>),
  get: (id: string) => api.get(`/lopa/${id}/scenario-consequence`).then(unwrap<LopaScenarioConsequence>),
  update: (id: string, values: LopaScenarioUpdate) => api.patch(`/lopa/${id}/scenario-consequence`, values).then(unwrap<LopaScenarioConsequence>),
  syncHazop: (id: string) => api.post(`/lopa/${id}/scenario-consequence/sync-hazop`).then(unwrap<LopaScenarioConsequence>),
  markComplete: (id: string) => api.post(`/lopa/${id}/scenario-consequence/mark-complete`).then(unwrap<LopaScenarioConsequence>),
  addReceptor: (id: string, values: Record<string, any>) => api.post(`/lopa/${id}/impacted-receptors`, values).then(unwrap<any>),
  updateReceptor: (id: string, receptorId: string, values: Record<string, any>) => api.patch(`/lopa/${id}/impacted-receptors/${receptorId}`, values).then(unwrap<any>),
  deleteReceptor: (id: string, receptorId: string) => api.delete(`/lopa/${id}/impacted-receptors/${receptorId}`).then(unwrap<any>),
  addNote: (id: string, values: Record<string, any>) => api.post(`/lopa/${id}/scenario-notes`, values).then(unwrap<any>),
  updateNote: (id: string, noteId: string, values: Record<string, any>) => api.patch(`/lopa/${id}/scenario-notes/${noteId}`, values).then(unwrap<any>),
  deleteNote: (id: string, noteId: string) => api.delete(`/lopa/${id}/scenario-notes/${noteId}`).then(unwrap<any>)
};
