import { api } from './api';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export type SearchResult = {
  id: string;
  moduleKey: string;
  entityType: string;
  entityId: string;
  recordType?: string | null;
  recordNumber?: string | null;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  status?: string | null;
  priority?: string | null;
  url?: string | null;
  updatedAt: string;
  score?: number;
};

export type SearchHistoryItem = {
  id: string;
  query: string;
  selectedRecordId?: string | null;
  selectedModule?: string | null;
  createdAt: string;
};

export type SearchParams = {
  q?: string | undefined;
  module?: string | undefined;
  siteId?: string | undefined;
  status?: string | undefined;
  limit?: number | undefined;
  offset?: number | undefined;
};

export const searchService = {
  async search(params: SearchParams): Promise<SearchResult[]> {
    return unwrap(await api.get('/search', { params }));
  },
  async recent(): Promise<SearchHistoryItem[]> {
    return unwrap(await api.get('/search/recent'));
  },
  async addHistory(input: { query: string; selectedRecordId?: string; selectedModule?: string }): Promise<SearchHistoryItem> {
    return unwrap(await api.post('/search/history', input));
  },
  async clearRecent(): Promise<{ deleted: boolean }> {
    return unwrap(await api.delete('/search/recent'));
  },
  async suggestions(q: string): Promise<SearchResult[]> {
    return unwrap(await api.get('/search/suggestions', { params: { q } }));
  },
  async reindex(module = 'all'): Promise<{ indexed: number }> {
    return unwrap(await api.post(`/search/reindex/${module}`));
  }
};
