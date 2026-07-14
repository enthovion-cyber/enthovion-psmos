'use client';

export function useUpgradeRequired(kind: 'module' | 'limit', key: string) {
  return {
    title: kind === 'module' ? 'Module upgrade required' : 'Plan limit reached',
    reason: kind === 'module' ? `Your current plan does not include ${key}.` : `Your current plan limit for ${key} has been reached.`,
    key
  };
}
