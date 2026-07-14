import { api } from '@/services/api';
import { hazopNodeParameterSchema, hazopNodeSchema, reorderHazopNodesSchema } from '../schemas/hazop-node.schema';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export const hazopNodeService = {
  context: (studyId: string) => api.get(`/hazop/${studyId}/nodes/context`).then(unwrap<any>),
  detail: (studyId: string, nodeId: string) => api.get(`/hazop/${studyId}/nodes/${nodeId}`).then(unwrap<any>),
  add: (studyId: string, values: Record<string, any>) => api.post(`/hazop/${studyId}/nodes`, hazopNodeSchema.parse(values)).then(unwrap<any>),
  update: (studyId: string, nodeId: string, values: Record<string, any>) => api.patch(`/hazop/${studyId}/nodes/${nodeId}`, hazopNodeSchema.partial().parse(values)).then(unwrap<any>),
  delete: (studyId: string, nodeId: string) => api.delete(`/hazop/${studyId}/nodes/${nodeId}`).then(unwrap<any>),
  duplicate: (studyId: string, nodeId: string) => api.post(`/hazop/${studyId}/nodes/${nodeId}/duplicate`).then(unwrap<any>),
  reorder: (studyId: string, nodeIds: string[]) => api.post(`/hazop/${studyId}/nodes/reorder`, reorderHazopNodesSchema.parse({ nodeIds })).then(unwrap<any>),
  markComplete: (studyId: string, nodeId: string) => api.post(`/hazop/${studyId}/nodes/${nodeId}/mark-complete`).then(unwrap<any>),
  reopen: (studyId: string, nodeId: string) => api.post(`/hazop/${studyId}/nodes/${nodeId}/reopen`).then(unwrap<any>),
  equipment: (studyId: string, nodeId: string) => api.get(`/hazop/${studyId}/nodes/${nodeId}/equipment`).then(unwrap<any[]>),
  documents: (studyId: string, nodeId: string) => api.get(`/hazop/${studyId}/nodes/${nodeId}/documents`).then(unwrap<any[]>),
  parameters: (studyId: string, nodeId: string) => api.get(`/hazop/${studyId}/nodes/${nodeId}/parameters`).then(unwrap<any[]>),
  replaceParameters: (studyId: string, nodeId: string, parameters: Record<string, any>[]) =>
    api.post(`/hazop/${studyId}/nodes/${nodeId}/parameters`, { parameters: parameters.map((item) => hazopNodeParameterSchema.parse(item)) }).then(unwrap<any[]>),
  masterParameters: (studyId: string) => api.get(`/hazop/${studyId}/parameters/master`).then(unwrap<any[]>),
  createCustomParameter: (studyId: string, values: Record<string, any>) => api.post(`/hazop/${studyId}/parameters/custom`, values).then(unwrap<any>)
};
