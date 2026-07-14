'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Filter, Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { SearchEmptyState } from '@/components/shared/SearchEmptyState';
import { SearchResultCard } from '@/components/shared/SearchResultCard';
import { SearchSkeleton } from '@/components/shared/SearchSkeleton';
import { useGlobalSearch, useRecentSearches, useSearchMutations } from '@/hooks/useSearch';
import type { SearchResult } from '@/services/search.service';

const modules = [
  ['all', 'All'],
  ['equipment', 'Equipment'],
  ['actions', 'Actions'],
  ['users', 'Users'],
  ['roles', 'Roles'],
  ['sites', 'Sites'],
  ['units', 'Units'],
  ['areas', 'Areas']
] as const;

const statuses = [
  ['all', 'All Status'],
  ['ACTIVE', 'Active'],
  ['OPEN', 'Open'],
  ['IN_PROGRESS', 'In Progress'],
  ['CLOSED', 'Closed']
] as const;

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [module, setModule] = useState('all');
  const [status, setStatus] = useState('all');
  const [activeIndex, setActiveIndex] = useState(0);
  const recentQuery = useRecentSearches();
  const mutations = useSearchMutations();

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedQuery(query), 200);
    return () => window.clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        onOpenChange(true);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onOpenChange]);

  useEffect(() => {
    if (!open) return;
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  const searchQuery = useGlobalSearch({
    q: debouncedQuery,
    module: module === 'all' ? undefined : module,
    status: status === 'all' ? undefined : status,
    limit: 20
  }, open && debouncedQuery.trim().length > 1);

  const results = searchQuery.data ?? [];
  const recent = recentQuery.data ?? [];
  const showRecent = debouncedQuery.trim().length <= 1;
  const activeResult = results[activeIndex];

  useEffect(() => setActiveIndex(0), [debouncedQuery, module, status]);

  function close() {
    onOpenChange(false);
  }

  async function selectResult(result: SearchResult) {
    await mutations.addHistory.mutateAsync({
      query: query.trim() || result.title,
      selectedRecordId: result.entityId,
      selectedModule: result.moduleKey
    });
    close();
    router.push(result.url || '/search');
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, Math.max(results.length - 1, 0)));
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    }
    if (event.key === 'Enter' && activeResult) {
      event.preventDefault();
      void selectResult(activeResult);
    }
  }

  const recentItems = useMemo(() => {
    const seen = new Set<string>();
    return recent.filter((item) => {
      const key = `${item.query}:${item.selectedRecordId ?? ''}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 6);
  }, [recent]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] bg-black/45 p-3 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true" aria-label="Global search">
      <div className="mx-auto flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-[var(--psm-line)] bg-[var(--psm-bg)] shadow-2xl">
        <div className="flex items-center gap-3 border-b border-[var(--psm-line)] p-4">
          <Search size={20} className="text-info" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            className="h-11 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-[var(--psm-muted)]"
            placeholder="Search equipment, actions, users, roles, sites, units, areas..."
          />
          <button type="button" onClick={close} className="grid h-9 w-9 place-items-center rounded-lg text-[var(--psm-muted)] hover:bg-[var(--psm-surface-3)] hover:text-[var(--psm-text)]" aria-label="Close search">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-[var(--psm-line)] p-3">
          <Filter size={15} className="text-[var(--psm-muted)]" />
          {modules.map(([key, label]) => (
            <button key={key} type="button" onClick={() => setModule(key)} className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${module === key ? 'border-info bg-info/10 text-info' : 'border-[var(--psm-line)] text-[var(--psm-muted)] hover:bg-[var(--psm-surface-2)]'}`}>{label}</button>
          ))}
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="psm-input ml-auto h-8 px-2 text-xs">
            {statuses.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-4">
          {showRecent ? (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wide text-[var(--psm-muted)]">Recent Searches</h3>
                {recentItems.length ? <button type="button" onClick={() => mutations.clearRecent.mutate()} className="text-xs font-semibold text-info">Clear</button> : null}
              </div>
              {recentItems.length ? (
                <div className="flex flex-wrap gap-2">
                  {recentItems.map((item) => (
                    <button key={item.id} type="button" onClick={() => setQuery(item.query)} className="rounded-full border border-[var(--psm-line)] bg-[var(--psm-surface)] px-3 py-2 text-sm hover:border-info hover:text-info">
                      {item.query}
                    </button>
                  ))}
                </div>
              ) : <SearchEmptyState title="Start typing to search PSM OS" description="Use tags, action numbers, user names, roles, sites, units, or areas." />}
            </div>
          ) : searchQuery.isLoading ? (
            <SearchSkeleton />
          ) : searchQuery.isError ? (
            <SearchEmptyState title="Search failed" description="The API could not return search results. Check your session and API server." />
          ) : results.length ? (
            <div className="space-y-2">
              {results.map((result, index) => (
                <SearchResultCard key={result.id} result={result} query={query} active={index === activeIndex} onSelect={() => selectResult(result)} />
              ))}
            </div>
          ) : (
            <SearchEmptyState />
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-[var(--psm-line)] px-4 py-3 text-xs text-[var(--psm-muted)]">
          <span>Enter opens</span>
          <span>Arrow keys move</span>
          <span>Esc closes</span>
          <span className="ml-auto hidden sm:inline">Ctrl K / Cmd K</span>
        </div>
      </div>
    </div>
  );
}
