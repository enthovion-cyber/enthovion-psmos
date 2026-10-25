'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Sliders, X } from 'lucide-react';
import { executivePsmElementApi } from '../../services/executive-psm-element.service';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mapping?: any;
}

export function EditPsmElementMappingDialog({ open, onOpenChange, mapping }: Props) {
  const [weight, setWeight] = useState(mapping?.weight ?? 10);
  const [isRequired, setIsRequired] = useState(mapping?.required_for_score ?? false);
  const client = useQueryClient();

  const update = useMutation({
    mutationFn: async () => {
      if (mapping?.id) {
        await executivePsmElementApi.updateMapping(mapping.id, { weight, required_for_score: isRequired });
      }
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['executive', 'psm-elements'] });
      onOpenChange(false);
    },
  });

  if (!open || !mapping) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-[var(--psm-line)] pb-3">
          <h3 className="font-bold text-lg text-[var(--psm-text)]">Edit Module Weight & Requirement</h3>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="text-[var(--psm-muted)] hover:text-[var(--psm-text)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-sm">
          <div>
            <span className="text-xs text-[var(--psm-muted)]">Source Module</span>
            <p className="font-bold text-[var(--psm-text)]">{mapping.source_module_label ?? mapping.source_module}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--psm-muted)]">Contribution Weight (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
              className="mt-1 block w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm text-[var(--psm-text)]"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isRequired}
              onChange={(e) => setIsRequired(e.target.checked)}
              className="rounded border-[var(--psm-line)] text-[var(--psm-primary)]"
            />
            <span className="text-xs font-semibold text-[var(--psm-text)]">
              Mandatory module (element shows &quot;Incomplete Data&quot; if disconnected)
            </span>
          </label>
        </div>

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
            onClick={() => update.mutate()}
            disabled={update.isPending}
            className="rounded-lg bg-[var(--psm-primary)] px-4 py-2 text-sm font-semibold text-white shadow hover:opacity-90 disabled:opacity-60"
          >
            {update.isPending ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
