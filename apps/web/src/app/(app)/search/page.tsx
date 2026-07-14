'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search as SearchIcon } from 'lucide-react';
import { SearchEmptyState } from '@/components/shared/SearchEmptyState';
import { SearchResultCard } from '@/components/shared/SearchResultCard';
import { SearchSkeleton } from '@/components/shared/SearchSkeleton';
import { useGlobalSearch, useSearchMutations } from '@/hooks/useSearch';
import type { SearchResult } from '@/services/search.service';

export default function GlobalSearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [module, setModule] = useState('all');
  const searchQuery = useGlobalSearch({ q: query, module: module === 'all' ? undefined : module, limit: 50 }, query.trim().length > 1);
  const mutations = useSearchMutations();

  async function openResult(result: SearchResult) {
    await mutations.addHistory.mutateAsync({ query, selectedRecordId: result.entityId, selectedModule: result.moduleKey });
    router.push(result.url || '/search');
  }

  return (
    <div className="space-y-5">
      <section className="psm-card p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Global Search</h1>
            <p className="mt-1 text-sm text-[var(--psm-muted)]">Search equipment, actions, users, roles, sites, units, and areas across your permitted tenant scope.</p>
          </div>
          <button type="button" onClick={() => mutations.reindex.mutate('all')} className="psm-button psm-button-secondary" disabled={mutations.reindex.isPending}>
            {mutations.reindex.isPending ? 'Reindexing...' : 'Reindex Foundation'}
          </button>
        </div>
        <div className="mt-5 flex flex-col gap-3 md:flex-row">
          <label className="relative min-w-0 flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--psm-muted)]" size={18} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} className="psm-input h-11 w-full pl-10 pr-3" placeholder="Search tag, action number, user, role, site, unit, area..." />
          </label>
          <select value={module} onChange={(event) => setModule(event.target.value)} className="psm-input h-11 px-3">
            <option value="all">All modules</option>
            <option value="equipment">Equipment</option>
            <option value="actions">Actions</option>
            <option value="users">Users</option>
            <option value="roles">Roles</option>
            <option value="sites">Sites</option>
            <option value="units">Units</option>
            <option value="areas">Areas</option>
          </select>
        </div>
      </section>

      <section className="psm-card p-4">
        {query.trim().length <= 1 ? (
          <SearchEmptyState title="Search across PSM OS" description="Type at least two characters to search indexed foundation records." />
        ) : searchQuery.isLoading ? (
          <SearchSkeleton />
        ) : searchQuery.isError ? (
          <SearchEmptyState title="Search failed" description="The API could not return search results." />
        ) : searchQuery.data?.length ? (
          <div className="space-y-2">
            {searchQuery.data.map((result) => <SearchResultCard key={result.id} result={result} query={query} onSelect={() => openResult(result)} />)}
          </div>
        ) : (
          <SearchEmptyState />
        )}
      </section>
    </div>
  );
}
