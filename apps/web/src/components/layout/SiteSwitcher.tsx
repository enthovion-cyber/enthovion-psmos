'use client';

import { useEffect, useState, useRef, KeyboardEvent } from 'react';
import { Building2, ChevronDown, Check } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useFoundationContext } from '@/hooks/useFoundation';
import { foundationService } from '@/services/foundation.service';
import { useAuthStore } from '@/stores/auth.store';

export function SiteSwitcher() {
  const queryClient = useQueryClient();
  const contextQuery = useFoundationContext();
  const selectedSiteId = useAuthStore((state) => state.selectedSiteId);
  const setSelectedSite = useAuthStore((state) => state.setSelectedSite);
  
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const optionsRef = useRef<HTMLButtonElement[]>([]);

  const sites = contextQuery.data?.sites ?? [];
  const activeSiteId = selectedSiteId ?? contextQuery.data?.selectedSiteId ?? sites[0]?.id ?? '';
  const activeSite = sites.find((site) => site.id === activeSiteId);
  const isLoading = contextQuery.isLoading;

  // Sync state with localStorage
  useEffect(() => {
    const stored = window.localStorage.getItem('psm.selectedSiteId');
    if (stored && stored !== selectedSiteId) setSelectedSite(stored);
  }, [selectedSiteId, setSelectedSite]);

  useEffect(() => {
    if (!selectedSiteId && activeSiteId) setSelectedSite(activeSiteId);
  }, [activeSiteId, selectedSiteId, setSelectedSite]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard accessibility navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    const currentIdx = optionsRef.current.findIndex((el) => el === document.activeElement);

    switch (e.key) {
      case 'Escape':
        setIsOpen(false);
        dropdownRef.current?.querySelector('button')?.focus();
        break;
      case 'ArrowDown':
        e.preventDefault();
        const nextIdx = (currentIdx + 1) % optionsRef.current.length;
        optionsRef.current[nextIdx]?.focus();
        break;
      case 'ArrowUp':
        e.preventDefault();
        const prevIdx = (currentIdx - 1 + optionsRef.current.length) % optionsRef.current.length;
        optionsRef.current[prevIdx]?.focus();
        break;
      default:
        break;
    }
  };

  async function switchSite(siteId: string) {
    const nextSiteId = siteId || null;
    try {
      await foundationService.switchSite(nextSiteId);
      setSelectedSite(nextSiteId);
      setIsOpen(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['equipment'] }),
        queryClient.invalidateQueries({ queryKey: ['actions'] }),
        queryClient.invalidateQueries({ queryKey: ['documents'] }),
        queryClient.invalidateQueries({ queryKey: ['notifications'] }),
        queryClient.invalidateQueries({ queryKey: ['search'] }),
        queryClient.invalidateQueries({ queryKey: ['foundation'] }),
        queryClient.invalidateQueries({ queryKey: ['workspace'] }),
        queryClient.invalidateQueries({ queryKey: ['iam', 'me'] })
      ]);
    } catch (error) {
      console.error('Failed to switch site context', error);
    }
  }

  // Render skeleton placeholder while data loads
  if (isLoading) {
    return (
      <div className="w-full sm:w-[240px] h-[54px] rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-2.5 flex items-center gap-2.5 animate-pulse">
        <div className="h-8 w-8 rounded-lg bg-[var(--psm-line)] shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-2/3 rounded bg-[var(--psm-line)]" />
          <div className="h-2 w-1/3 rounded bg-[var(--psm-line)]" />
        </div>
      </div>
    );
  }

  return (
    <div 
      className="relative inline-block w-full sm:max-w-[240px] text-sm" 
      ref={dropdownRef}
      onKeyDown={handleKeyDown}
    >
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex w-full items-center justify-between gap-2 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-2.5 text-[var(--psm-text)] shadow-sm transition-all duration-200 hover:bg-[var(--psm-line)]/20 focus:outline-none focus:ring-2 focus:ring-info/30 focus:border-info/80 ${isOpen ? 'ring-2 ring-info/30 border-info/80' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Switch active site"
      >
        <div className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-info/10 text-info">
            <Building2 size={18} />
          </div>
          
          <div className="block min-w-0 flex-1">
            <p className="truncate font-medium leading-tight mb-0.5">
              {!activeSiteId && contextQuery.data?.corporateView ? "All Sites" : (activeSite?.name ?? "Select Site")}
            </p>
            {activeSite?.code && (
              <span className="block truncate text-xs text-[var(--psm-muted)] leading-none">
                {activeSite.code}
              </span>
            )}
          </div>
        </div>
        
        <ChevronDown 
          size={16} 
          className={`text-[var(--psm-muted)] transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180 text-info' : ''}`} 
        />
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div 
          className="absolute left-0 right-0 mt-2 z-50 max-h-64 overflow-y-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-1.5 shadow-xl transition-all origin-top scale-100 opacity-100"
          role="listbox"
          aria-label="Site list options"
        >
          {/* Corporate / All Sites Option */}
          {contextQuery.data?.corporateView && (
            <button
              type="button"
              ref={(el) => { if (el) optionsRef.current[0] = el; }}
              onClick={() => switchSite('')}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-colors focus:outline-none focus:bg-[var(--psm-line)]/40 ${
                activeSiteId === '' 
                  ? 'bg-info/10 text-info font-medium' 
                  : 'text-[var(--psm-text)] hover:bg-[var(--psm-line)]/30'
              }`}
              role="option"
              aria-selected={activeSiteId === ''}
            >
              <span className="font-medium">All Sites</span>
              {activeSiteId === '' && <Check size={16} className="text-info shrink-0" />}
            </button>
          )}

          {/* Individual Site Options */}
          {sites.map((site, index) => {
            const isSelected = site.id === activeSiteId;
            const refIndex = contextQuery.data?.corporateView ? index + 1 : index;
            
            return (
              <button
                key={site.id}
                type="button"
                ref={(el) => { if (el) optionsRef.current[refIndex] = el; }}
                onClick={() => switchSite(site.id)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-colors focus:outline-none focus:bg-[var(--psm-line)]/40 ${
                  isSelected 
                    ? 'bg-info/10 text-info font-medium' 
                    : 'text-[var(--psm-text)] hover:bg-[var(--psm-line)]/30'
                }`}
                role="option"
                aria-selected={isSelected}
              >
                <div className="min-w-0 flex-1 pr-2">
                  <span className="block truncate">{site.name}</span>
                  {site.code && (
                    <span className={`block text-xs truncate mt-0.5 ${isSelected ? 'text-info/80' : 'text-[var(--psm-muted)]'}`}>
                      {site.code}
                    </span>
                  )}
                </div>
                {isSelected && <Check size={16} className="text-info shrink-0" />}
              </button>
            );
          })}

          {sites.length === 0 && !contextQuery.data?.corporateView && (
            <div className="px-3 py-6 text-center text-xs text-[var(--psm-muted)]">
              No managed sites found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
