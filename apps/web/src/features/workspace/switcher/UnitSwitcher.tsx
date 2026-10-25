'use client';

import { useEffect, useState } from 'react';
import { Layers3, ChevronDown, Check } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { foundationService, type FoundationEntity } from '@/services/foundation.service';
import { useAuthStore } from '@/stores/auth.store';

const moduleQueryRoots = ['dashboard', 'equipment', 'actions', 'documents', 'ptw', 'moc', 'pssr', 'hazop', 'lopa', 'incidents'];

export function UnitSwitcher() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const selectedSiteId = useAuthStore((state: any) => state.selectedSiteId);
  const selectedUnitId = useAuthStore((state: any) => state.selectedUnitId);
  const setSelectedUnit = useAuthStore((state: any) => state.setSelectedUnit);

  useEffect(() => {
    setMounted(true);
    const stored = window.localStorage.getItem('psm.selectedUnitId');
    if (stored && stored !== selectedUnitId) {
      setSelectedUnit(stored);
    }
  }, []);

  const { data: allUnits = [], isLoading } = useQuery({
    queryKey: ['foundation', 'units', selectedSiteId],
    queryFn: () => foundationService.units(),
    staleTime: 60_000
  });

  const siteUnits = selectedSiteId
    ? allUnits.filter((u: FoundationEntity) => u.siteId === selectedSiteId)
    : allUnits;

  const activeUnit = siteUnits.find((u: FoundationEntity) => u.id === selectedUnitId) ?? null;

  async function switchUnit(unitId: string | null) {
    setSelectedUnit(unitId);
    setOpen(false);
    await Promise.all(moduleQueryRoots.map((root) => queryClient.invalidateQueries({ queryKey: [root] })));
  }

  if (!mounted || isLoading) {
    return <div className="hidden h-11 w-48 animate-pulse rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] lg:block" />;
  }

  return (
    <div className="relative hidden w-full sm:max-w-48 lg:block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] px-3 text-sm shadow-sm transition hover:bg-[var(--psm-surface-2)]"
        title="Filter context by Process Unit"
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <Layers3 size={16} />
          </span>
          <span className="min-w-0 text-left">
            <span className="block truncate font-medium text-xs">
              {activeUnit?.name ?? 'All Process Units'}
            </span>
            <span className="block truncate text-[11px] text-[var(--psm-muted)]">
              {activeUnit?.code ?? (siteUnits.length ? `${siteUnits.length} Units` : 'Plant Wide')}
            </span>
          </span>
        </span>
        <ChevronDown size={14} className={`shrink-0 text-[var(--psm-muted)] transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-72 overflow-y-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-1.5 shadow-xl">
          <button
            type="button"
            onClick={() => switchUnit(null)}
            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-[var(--psm-surface-3)]"
          >
            <div>
              <span className="block font-medium">All Process Units</span>
              <span className="block text-xs text-[var(--psm-muted)]">Site-wide overview</span>
            </div>
            {!selectedUnitId && <Check size={15} className="text-primary" />}
          </button>

          {siteUnits.map((unit: FoundationEntity) => {
            const opStatus = unit.status ?? 'IN_SERVICE';
            const isTurnaround = opStatus === 'TURNAROUND';
            return (
              <button
                key={unit.id}
                type="button"
                onClick={() => switchUnit(unit.id)}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-[var(--psm-surface-3)]"
              >
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate font-medium">{unit.name}</span>
                    {isTurnaround && (
                      <span className="rounded bg-amber-500/20 px-1 text-[10px] font-bold text-amber-500">
                        TAR
                      </span>
                    )}
                  </div>
                  <span className="block truncate text-xs text-[var(--psm-muted)]">
                    {unit.code ? `[${unit.code}] ` : ''}{unit.description || 'Process Unit'}
                  </span>
                </div>
                {unit.id === selectedUnitId && <Check size={15} className="shrink-0 text-primary" />}
              </button>
            );
          })}

          {!siteUnits.length && (
            <div className="px-3 py-4 text-center text-xs text-[var(--psm-muted)]">
              No process units registered for this site.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
