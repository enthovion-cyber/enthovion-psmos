'use client';

import { useState } from 'react';
import type { HazopHistoryFilters } from '../types/hazop-history.types';

export function useHazopHistoryFilters(initial: HazopHistoryFilters = { category: 'All', severity: 'All' }) {
  return useState<HazopHistoryFilters>(initial);
}
