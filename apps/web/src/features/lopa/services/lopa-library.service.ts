import { api } from '@/services/api';
import type { ConditionalModifierLibraryRecord, InitiatingEventLibraryRecord, LibraryFilters, LopaLibraryResponse, LopaLibrarySummary } from '../types/lopa-library.types';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

function params(filters?: LibraryFilters) {
  const entries = Object.fromEntries(Object.entries(filters ?? {}).filter(([, value]) => value !== '' && value !== undefined && value !== false));
  if ((entries as any).search && !(entries as any).q) {
    (entries as any).q = (entries as any).search;
    delete (entries as any).search;
  }
  return entries;
}

export const lopaLibraryService = {
  context: () => api.get('/lopa/libraries/context').then(unwrap<any>),
  initiatingSummary: () => api.get('/lopa/libraries/initiating-events/summary').then(unwrap<LopaLibrarySummary>),
  initiatingList: (filters?: LibraryFilters) => api.get('/lopa/libraries/initiating-events', { params: params(filters) }).then(unwrap<LopaLibraryResponse<InitiatingEventLibraryRecord>>),
  initiatingDetail: (id: string) => api.get(`/lopa/libraries/initiating-events/${id}`).then(unwrap<InitiatingEventLibraryRecord>),
  initiatingCreate: (values: Record<string, any>) => api.post('/lopa/libraries/initiating-events', values).then(unwrap<InitiatingEventLibraryRecord>),
  initiatingUpdate: (id: string, values: Record<string, any>) => api.patch(`/lopa/libraries/initiating-events/${id}`, values).then(unwrap<InitiatingEventLibraryRecord>),
  initiatingAction: (id: string, action: 'submit-review' | 'approve' | 'reject' | 'create-revision' | 'archive', reason?: string) => api.post(`/lopa/libraries/initiating-events/${id}/${action}`, { reason }).then(unwrap<InitiatingEventLibraryRecord>),
  modifierSummary: () => api.get('/lopa/libraries/conditional-modifiers/summary').then(unwrap<LopaLibrarySummary>),
  modifierList: (filters?: LibraryFilters) => api.get('/lopa/libraries/conditional-modifiers', { params: params(filters) }).then(unwrap<LopaLibraryResponse<ConditionalModifierLibraryRecord>>),
  modifierDetail: (id: string) => api.get(`/lopa/libraries/conditional-modifiers/${id}`).then(unwrap<ConditionalModifierLibraryRecord>),
  modifierCreate: (values: Record<string, any>) => api.post('/lopa/libraries/conditional-modifiers', values).then(unwrap<ConditionalModifierLibraryRecord>),
  modifierUpdate: (id: string, values: Record<string, any>) => api.patch(`/lopa/libraries/conditional-modifiers/${id}`, values).then(unwrap<ConditionalModifierLibraryRecord>),
  modifierAction: (id: string, action: 'submit-review' | 'approve' | 'reject' | 'create-revision' | 'archive', reason?: string) => api.post(`/lopa/libraries/conditional-modifiers/${id}/${action}`, { reason }).then(unwrap<ConditionalModifierLibraryRecord>),
  selectInitiatingEvent: (studyId: string, values: Record<string, any>) => api.post(`/lopa/${studyId}/initiating-event/select-from-library`, values).then(unwrap<any>),
  selectModifier: (studyId: string, values: Record<string, any>) => api.post(`/lopa/${studyId}/conditional-modifiers/select`, values).then(unwrap<any>),
  studyModifiers: (studyId: string) => api.get(`/lopa/${studyId}/conditional-modifiers`).then(unwrap<any[]>)
};
