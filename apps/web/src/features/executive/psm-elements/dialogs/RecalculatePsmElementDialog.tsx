'use client';

import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, X } from 'lucide-react';
import { executivePsmElementApi } from '../../services/executive-psm-element.service';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  elementId: string;
  elementName: string;
}

export function RecalculatePsmElementDialog({ open, onOpenChange, elementId, elementName }: Props) {
  const client = useQueryClient();

  const recalc = useMutation({
    mutationFn: () => executivePsmElementApi.recalculate(elementId),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['executive', 'psm-elements'] });
      onOpenChange(false);
    },
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-[var(--psm-line)] pb-3">
          <h3 className="font-bold text-lg text-[var(--psm-text)]">Recalculate Element Score</h3>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="text-[var(--psm-muted)] hover:text-[var(--psm-text)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-4 text-sm text-[var(--psm-muted)]">
          Recalculate the governance health score for <strong className="text-[var(--psm-text)]">{elementName}</strong>.
          This invokes active module adapters and synchronizes critical gaps, pending approvals, and overdue actions.
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-lg border border-[var(--psm-line)] px-4 py-2 text-sm font-semibold text-[var(--psm-text)] hover:bg-[var(--psm-surface-2)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => recalc.mutate()}
            disabled={recalc.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--psm-primary)] px-4 py-2 text-sm font-semibold text-white shadow hover:opacity-90 disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${recalc.isPending ? 'animate-spin' : ''}`} />
            {recalc.isPending ? 'Recalculating…' : 'Start Recalculation'}
          </button>
        </div>
      </div>
    </div>
  );
}
