'use client';

import React from 'react';

// Export all specialized feature pages
export { ExecutiveReportsDashboardPage } from './ExecutiveReportsDashboardPage';
export { ExecutiveReportRegisterPage } from './ExecutiveReportRegisterPage';
export { ExecutiveBoardReportingPage } from './ExecutiveBoardReportingPage';
export { ExecutiveReportBuilderWizardPage } from './ExecutiveReportBuilderWizardPage';
export { ExecutiveReportDetailPage } from './ExecutiveReportDetailPage';
export { ExecutiveReportTemplatesPage } from './ExecutiveReportTemplatesPage';
export { ExecutiveReportingPeriodsPage } from './ExecutiveReportingPeriodsPage';
export { ExecutiveReportDistributionPage } from './ExecutiveReportDistributionPage';
export {
  ExecutiveReportAudiencesPage,
  ExecutiveReportSchedulesPage,
  ExecutiveReportStalenessPage,
} from './ExecutiveReportGovernancePages';

import { ExecutiveReportsDashboardPage } from './ExecutiveReportsDashboardPage';
import { ExecutiveReportRegisterPage } from './ExecutiveReportRegisterPage';
import { ExecutiveBoardReportingPage } from './ExecutiveBoardReportingPage';
import { ExecutiveReportBuilderWizardPage } from './ExecutiveReportBuilderWizardPage';
import { ExecutiveReportTemplatesPage } from './ExecutiveReportTemplatesPage';
import { ExecutiveReportingPeriodsPage } from './ExecutiveReportingPeriodsPage';
import { ExecutiveReportDistributionPage } from './ExecutiveReportDistributionPage';
import {
  ExecutiveReportAudiencesPage,
  ExecutiveReportSchedulesPage,
  ExecutiveReportStalenessPage,
} from './ExecutiveReportGovernancePages';

export function ExecutiveReportSectionPage({ section }: { section: string }) {
  const s = (section || 'dashboard').toLowerCase();

  switch (s) {
    case 'dashboard':
      return <ExecutiveReportsDashboardPage />;
    case 'board':
    case 'board-packages':
    case 'board-assurance':
      return <ExecutiveBoardReportingPage />;
    case 'register':
    case 'reports':
      return <ExecutiveReportRegisterPage />;
    case 'new':
    case 'builder':
    case 'create':
      return <ExecutiveReportBuilderWizardPage />;
    case 'templates':
      return <ExecutiveReportTemplatesPage />;
    case 'periods':
      return <ExecutiveReportingPeriodsPage />;
    case 'audiences':
      return <ExecutiveReportAudiencesPage />;
    case 'schedules':
      return <ExecutiveReportSchedulesPage />;
    case 'distribution':
      return <ExecutiveReportDistributionPage />;
    case 'staleness':
    case 'lineage':
      return <ExecutiveReportStalenessPage />;
    default:
      return <ExecutiveReportsDashboardPage />;
  }
}
