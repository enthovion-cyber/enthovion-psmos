import { get, patch, post, remove } from './psi-api';
import type { ProcessChemistryDetail, ProcessChemistryLookups, ProcessChemistryRegistry, ProcessChemistrySummary } from '../types/process-chemistry.types';

const base = '/process-safety-information';

export const processChemistryService = {
  registry: (params: Record<string, unknown> = {}) => get<ProcessChemistryRegistry>(`${base}/process-chemistry`, params),
  unitRegistry: (unitId: string, params: Record<string, unknown> = {}) => get<ProcessChemistryRegistry>(`${base}/units/${unitId}/process-chemistry`, params),
  summary: (params: Record<string, unknown> = {}) => get<ProcessChemistrySummary>(`${base}/process-chemistry/summary`, params),
  detail: (chemistryId: string) => get<ProcessChemistryDetail>(`${base}/process-chemistry/${chemistryId}`),
  create: (input: Record<string, unknown>) => post<ProcessChemistryDetail>(`${base}/process-chemistry`, input),
  createForUnit: (unitId: string, input: Record<string, unknown>) => post<ProcessChemistryDetail>(`${base}/units/${unitId}/process-chemistry`, input),
  update: (chemistryId: string, input: Record<string, unknown>) => patch<ProcessChemistryDetail>(`${base}/process-chemistry/${chemistryId}`, input),
  archive: (chemistryId: string, input: Record<string, unknown>) => post<Record<string, unknown>>(`${base}/process-chemistry/${chemistryId}/archive`, input),
  reactivate: (chemistryId: string, input: Record<string, unknown>) => post<Record<string, unknown>>(`${base}/process-chemistry/${chemistryId}/reactivate`, input),
  roles: (chemistryId: string) => get<Record<string, unknown>[]>(`${base}/process-chemistry/${chemistryId}/chemicals`),
  addRole: (chemistryId: string, input: Record<string, unknown>) => post<Record<string, unknown>[]>(`${base}/process-chemistry/${chemistryId}/chemicals`, input),
  updateRole: (chemistryId: string, roleId: string, input: Record<string, unknown>) => patch<Record<string, unknown>[]>(`${base}/process-chemistry/${chemistryId}/chemicals/${roleId}`, input),
  removeRole: (chemistryId: string, roleId: string) => remove<Record<string, unknown>[]>(`${base}/process-chemistry/${chemistryId}/chemicals/${roleId}`),
  updateConditions: (chemistryId: string, input: Record<string, unknown>) => patch<ProcessChemistryDetail>(`${base}/process-chemistry/${chemistryId}/conditions`, input),
  updateHazards: (chemistryId: string, input: Record<string, unknown>) => patch<ProcessChemistryDetail>(`${base}/process-chemistry/${chemistryId}/hazards`, input),
  scenarios: (chemistryId: string) => get<Record<string, unknown>[]>(`${base}/process-chemistry/${chemistryId}/scenarios`),
  saveScenario: (chemistryId: string, input: Record<string, unknown>, scenarioId?: string) => scenarioId ? patch<Record<string, unknown>[]>(`${base}/process-chemistry/${chemistryId}/scenarios/${scenarioId}`, input) : post<Record<string, unknown>[]>(`${base}/process-chemistry/${chemistryId}/scenarios`, input),
  removeScenario: (chemistryId: string, scenarioId: string) => remove<Record<string, unknown>[]>(`${base}/process-chemistry/${chemistryId}/scenarios/${scenarioId}`),
  controls: (chemistryId: string) => get<Record<string, unknown>[]>(`${base}/process-chemistry/${chemistryId}/controls`),
  saveControl: (chemistryId: string, input: Record<string, unknown>, controlId?: string) => controlId ? patch<Record<string, unknown>[]>(`${base}/process-chemistry/${chemistryId}/controls/${controlId}`, input) : post<Record<string, unknown>[]>(`${base}/process-chemistry/${chemistryId}/controls`, input),
  removeControl: (chemistryId: string, controlId: string) => remove<Record<string, unknown>[]>(`${base}/process-chemistry/${chemistryId}/controls/${controlId}`),
  runCompleteness: (chemistryId: string) => post<Record<string, unknown>[]>(`${base}/process-chemistry/${chemistryId}/completeness/run`),
  submitReview: (chemistryId: string, input: Record<string, unknown>) => post<Record<string, unknown>>(`${base}/process-chemistry/${chemistryId}/submit-review`, input),
  linkDocument: (chemistryId: string, input: Record<string, unknown>) => post<Record<string, unknown>[]>(`${base}/process-chemistry/${chemistryId}/documents`, input),
  unlinkDocument: (chemistryId: string, documentLinkId: string, input: Record<string, unknown>) => remove<Record<string, unknown>[]>(`${base}/process-chemistry/${chemistryId}/documents/${documentLinkId}`, input),
  importTemplate: () => get<Record<string, unknown>>(`${base}/process-chemistry/import-template`),
  importPreview: (input: Record<string, unknown>) => post<Record<string, unknown>>(`${base}/process-chemistry/import`, input),
  exportRows: (params: Record<string, unknown> = {}) => get<Record<string, unknown>>(`${base}/process-chemistry/export`, params),
  lookups: async (): Promise<ProcessChemistryLookups> => ({
    chemistryTypes: await get<string[]>(`${base}/lookups/chemistry-types`),
    reactionPhases: await get<string[]>(`${base}/lookups/reaction-phases`),
    operatingModes: await get<string[]>(`${base}/lookups/operating-modes`),
    chemicalRoles: await get<string[]>(`${base}/lookups/chemical-roles`),
    reactionHazardLevels: await get<string[]>(`${base}/lookups/reaction-hazard-levels`),
    unwantedScenarioTypes: await get<string[]>(`${base}/lookups/unwanted-scenario-types`),
    chemistryControlTypes: await get<string[]>(`${base}/lookups/chemistry-control-types`)
  })
};
