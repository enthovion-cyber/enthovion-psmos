import { api } from '@/services/api';
import type {
  AiStatusResponse,
  CopilotAnswer,
  DocumentCompareRequest,
  DocumentCompareResponse,
  LopaCalculationRequest,
  LopaCalculationResult
} from '../types';

const unwrap = <T,>(response: { data: { data: T } | T }) => {
  const d = response.data;
  if (d && typeof d === 'object' && 'data' in d) {
    return (d as { data: T }).data;
  }
  return d as T;
};

export const copilotService = {
  getStatus: () => api.get('/ai/status', { timeout: 15000 }).then(unwrap<AiStatusResponse>),
  
  ask: (question: string, contextModule?: string, signal?: AbortSignal) =>
    api
      .post('/ai/copilot/ask', { question, contextModule }, { timeout: 45000, ...(signal ? { signal } : {}) })
      .then(unwrap<CopilotAnswer>),

  calculateLopa: (payload: LopaCalculationRequest) =>
    api.post('/ai/tools/lopa', payload, { timeout: 30000 }).then(unwrap<LopaCalculationResult>),

  compareDocuments: (payload: DocumentCompareRequest) =>
    api.post('/ai/documents/compare', payload, { timeout: 45000 }).then(unwrap<DocumentCompareResponse>)
};
