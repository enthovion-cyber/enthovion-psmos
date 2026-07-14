'use client';

import { useUpgradeRequired } from './hooks/useUpgradeRequired';
import { UpgradeRequiredDialog } from './UpgradeRequiredDialog';

export function UpgradeRequiredPage({ kind = 'module', value = 'feature' }: { kind?: 'module' | 'limit'; value?: string }) {
  const state = useUpgradeRequired(kind, value);
  return <section className="mx-auto max-w-2xl p-6"><UpgradeRequiredDialog title={state.title} reason={state.reason} /></section>;
}
