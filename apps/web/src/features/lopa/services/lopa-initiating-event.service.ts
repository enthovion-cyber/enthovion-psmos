import { api } from '@/services/api';
import type { LopaInitiatingEventContext, LopaInitiatingEventTabData, LopaInitiatingEventUpdate } from '../types/lopa-initiating-event.types';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export const lopaInitiatingEventService = {
  context: (id: string) => api.get(`/lopa/${id}/initiating-event/context`).then(unwrap<LopaInitiatingEventContext>),
  get: (id: string) => api.get(`/lopa/${id}/initiating-event`).then(unwrap<LopaInitiatingEventTabData>),
  update: (id: string, values: LopaInitiatingEventUpdate) => api.patch(`/lopa/${id}/initiating-event`, values).then(unwrap<LopaInitiatingEventTabData>),
  saveManualFrequency: (id: string, values: Record<string, any>) => api.post(`/lopa/${id}/initiating-event/manual-frequency`, values).then(unwrap<LopaInitiatingEventTabData>),
  saveSiteModifier: (id: string, values: Record<string, any>) => api.post(`/lopa/${id}/initiating-event/site-modifier`, values).then(unwrap<LopaInitiatingEventTabData>),
  markComplete: (id: string) => api.post(`/lopa/${id}/initiating-event/mark-complete`).then(unwrap<LopaInitiatingEventTabData>),
  updateModifier: (id: string, snapshotId: string, values: Record<string, any>) => api.patch(`/lopa/${id}/conditional-modifiers/${snapshotId}`, values).then(unwrap<any>),
  archiveModifier: (id: string, snapshotId: string) => api.post(`/lopa/${id}/conditional-modifiers/${snapshotId}/archive`).then(unwrap<any>),
  addNote: (id: string, values: Record<string, any>) => api.post(`/lopa/${id}/initiating-event-notes`, values).then(unwrap<any>),
  updateNote: (id: string, noteId: string, values: Record<string, any>) => api.patch(`/lopa/${id}/initiating-event-notes/${noteId}`, values).then(unwrap<any>),
  deleteNote: (id: string, noteId: string) => api.delete(`/lopa/${id}/initiating-event-notes/${noteId}`).then(unwrap<any>)
};
