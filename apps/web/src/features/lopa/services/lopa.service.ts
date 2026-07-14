import { api } from '@/services/api';
import type { LopaAttentionItem, LopaContext, LopaCreateValues, LopaHazopScenario, LopaOwnerProfile, LopaRegisterResponse, LopaStudy, LopaSummary, LopaTeamSuggestionResponse, LopaUserSearchResult } from '../types/lopa.types';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export const lopaService = {
  summary: () => api.get('/lopa/summary').then(unwrap<LopaSummary>),
  list: (params?: Record<string, any>) => api.get('/lopa', { params }).then(unwrap<LopaRegisterResponse>),
  attention: () => api.get('/lopa/attention').then(unwrap<LopaAttentionItem[]>),
  context: () => api.get('/lopa/context').then(unwrap<LopaContext>),
  createContext: () => api.get('/lopa/create/context').then(unwrap<LopaContext>),
  sourceOptions: () => api.get('/lopa/create/source-options').then(unwrap<any>),
  createHazopRequiredScenarios: () => api.get('/lopa/create/hazop-required-scenarios').then(unwrap<LopaHazopScenario[]>),
  teamSuggestions: (params: Record<string, any>) => api.get('/lopa/create/team-suggestions', { params }).then(unwrap<LopaTeamSuggestionResponse>),
  userSearch: (params: Record<string, any>) => api.get('/lopa/create/user-search', { params }).then(unwrap<LopaUserSearchResult[]>),
  ownerProfile: (ownerId: string, params: Record<string, any>) => api.get(`/lopa/create/owner-profile/${ownerId}`, { params }).then(unwrap<LopaOwnerProfile>),
  hazopRequiredScenarios: () => api.get('/lopa/hazop-required-scenarios').then(unwrap<LopaHazopScenario[]>),
  hazopScenario: (scenarioId: string) => api.get(`/lopa/hazop-required-scenarios/${scenarioId}`).then(unwrap<LopaHazopScenario>),
  get: (id: string) => api.get(`/lopa/${id}`).then(unwrap<LopaStudy>),
  create: (values: LopaCreateValues) => api.post('/lopa', normalizeCreate(values)).then(unwrap<LopaStudy>),
  saveDraft: (values: LopaCreateValues) => api.post('/lopa/save-draft', normalizeCreate(values)).then(unwrap<LopaStudy>),
  createFromHazop: (scenarioId: string, values: LopaCreateValues & { allowDuplicate?: boolean; duplicateReason?: string }) => api.post(`/lopa/from-hazop/${scenarioId}`, normalizeCreate(values)).then(unwrap<LopaStudy>),
  sendInvitations: (id: string, values: { message?: string; reason?: string }) => api.post(`/lopa/${id}/team-members/send-invitations`, values).then(unwrap<any>)
};

function normalizeCreate(values: LopaCreateValues) {
  return {
    title: values.title,
    description: optionalText(values.description),
    studyType: values.studyType,
    source: values.source,
    sourceModule: values.creationMethod === 'hazop' ? 'HAZOP' : values.source,
    sourceRecordId: values.hazopScenarioId || undefined,
    hazopScenarioId: values.hazopScenarioId || undefined,
    companyId: optionalText(values.companyId),
    siteId: values.siteId,
    unitId: optionalText(values.unitId),
    areaId: optionalText(values.areaId),
    equipmentTag: optionalText(values.equipmentTag),
    equipmentId: optionalText(values.equipmentId),
    ownerId: values.ownerId,
    facilitatorId: optionalText(values.facilitatorId),
    priority: optionalText(values.priority),
    dueDate: optionalText(values.dueDate),
    revalidationDueDate: optionalText(values.revalidationDueDate),
    confidentialityLevel: optionalText(values.confidentialityLevel),
    tags: values.tags ?? [],
    notes: optionalText(values.notes),
    consequence: values.consequence ?? {},
    initiatingEvent: values.initiatingEvent ?? {},
    importedSafeguards: values.importedSafeguards ?? [],
    teamMembers: (values.teamMembers ?? []).map((member) => ({
      userId: optionalText(member.userId),
      contactId: optionalText(member.contactId),
      displayName: optionalText(member.displayName ?? member.fullName),
      email: optionalText(member.email),
      role: member.role,
      discipline: optionalText(member.discipline),
      required: member.required,
      organization: optionalText(member.organization),
      internalExternal: optionalText(member.internalExternal),
      jobTitle: optionalText(member.jobTitle),
      department: optionalText(member.department),
      responsibility: optionalText(member.responsibility),
      reviewer: member.reviewer,
      approver: member.approver,
      facilitator: member.facilitator,
      scribe: member.scribe,
      accessLevel: optionalText(member.accessLevel),
      invitationRequired: member.invitationRequired,
      invitationMode: optionalText(member.invitationMode),
      invitationMessage: optionalText(member.invitationMessage),
      invitationDueDate: optionalText(member.invitationDueDate),
      suggestionReasons: member.suggestionReasons,
      suggestionSource: optionalText(member.suggestionSource)
    })),
    sendInvitations: values.sendInvitations,
    invitationMessage: optionalText(values.invitationMessage),
    invitationDueDate: optionalText(values.invitationDueDate),
    ...((values as LopaCreateValues & { allowDuplicate?: boolean }).allowDuplicate !== undefined ? { allowDuplicate: (values as LopaCreateValues & { allowDuplicate?: boolean }).allowDuplicate } : {}),
    ...((values as LopaCreateValues & { duplicateReason?: string }).duplicateReason ? { duplicateReason: (values as LopaCreateValues & { duplicateReason?: string }).duplicateReason } : {})
  };
}

function optionalText(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}
