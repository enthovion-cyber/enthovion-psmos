'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Camera, X } from 'lucide-react';
import { executivePsmElementApi } from '../../services/executive-psm-element.service';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultScopeType?: string;
  defaultScopeId?: string;
}

export function CreatePsmElementSnapshotDialog({
  open,
  onOpenChange,
  defaultScopeType = 'company',
  defaultScopeId,
}: Props) {
  const [title, setTitle] = useState('');
  const client = useQueryClient();

  const create = useMutation({
    mutationFn: () =>
      executivePsmElementApi.createSnapshot({
        snapshotTitle: title.trim() || 'PSM Governance Audit Snapshot',
        scopeType: defaultScopeType,
        siteId: defaultScopeType === 'site' ? defaultScopeId : undefined,
        unitId: defaultScopeType === 'unit' ? defaultScopeId : undefined,
      }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['executive', 'psm-elements'] });
      setTitle('');
      onOpenChange(false);
    },
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-[var(--psm-line)] pb-3">
          <h3 className="font-bold text-lg text-[var(--psm-text)]">Capture PSM Element Snapshot</h3>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="text-[var(--psm-muted)] hover:text-[var(--psm-text)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--psm-muted)]">Snapshot Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Q4 Executive Leadership PSM Review"
              className="mt-1 block w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm text-[var(--psm-text)] focus:outline-none focus:ring-1 focus:ring-[var(--psm-primary)]"
            />
          </div>

          <p className="text-xs text-[var(--psm-muted)]">
            Captures an immutable record of all 20 PSM element health scores, contributing KPIs, open critical gaps, and data quality states.
          </p>
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
            onClick={() => create.mutate()}
            disabled={create.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--psm-primary)] px-4 py-2 text-sm font-semibold text-white shadow hover:opacity-90 disabled:opacity-60"
          >
            <Camera className="h-4 w-4" />
            {create.isPending ? 'Capturing…' : 'Capture Snapshot'}
          </button>
        </div>
      </div>
    </div>
  );
}
