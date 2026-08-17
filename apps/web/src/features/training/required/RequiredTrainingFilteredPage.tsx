'use client';

import { RequiredTrainingLibraryPage } from './RequiredTrainingLibraryPage';
import { RequiredTrainingDashboardPage } from './RequiredTrainingDashboardPage';

export function RequiredTrainingFilteredPage({ view, id }: { view: 'categories' | 'safety' | 'ptw' | 'psm' | 'review-overdue' | 'pending-approval' | 'matrix-unlinked' | 'site' | 'unit' | 'area'; id?: string }) {
  if (view === 'categories') return <RequiredTrainingDashboardPage />;
  const filters: Record<string, string> = {};
  if (view === 'safety') filters.safetyCritical = 'true';
  if (view === 'ptw') filters.ptwCritical = 'true';
  if (view === 'psm') filters.psmCritical = 'true';
  if (view === 'review-overdue') filters.reviewOverdue = 'true';
  if (view === 'pending-approval') filters.reviewStatus = 'Pending Review';
  if (view === 'matrix-unlinked') filters.matrixSyncStatus = 'Not Linked';
  if (view === 'site' && id) filters.siteId = id;
  if (view === 'unit' && id) filters.unitId = id;
  if (view === 'area' && id) filters.areaId = id;
  return <RequiredTrainingLibraryPage initialFilters={filters} />;
}
