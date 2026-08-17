'use client';

import type { ReactNode } from 'react';
import { ReviewButton } from '../ReviewApprovalPrimitives';

export function DecisionDialogShell({ title, children, onClose, onSubmit, submitLabel = 'Submit' }: { title: string; children: ReactNode; onClose: () => void; onSubmit: () => void; submitLabel?: string }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-2xl">
        <h2 className="text-lg font-semibold">{title}</h2>
        <div className="mt-4">{children}</div>
        <div className="mt-5 flex justify-end gap-2">
          <ReviewButton onClick={onClose}>Cancel</ReviewButton>
          <ReviewButton onClick={onSubmit} variant="primary">{submitLabel}</ReviewButton>
        </div>
      </div>
    </div>
  );
}
