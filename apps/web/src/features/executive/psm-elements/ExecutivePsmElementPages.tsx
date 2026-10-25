'use client';

import React from 'react';
import { ExecutivePsmElementDashboardPage } from './ExecutivePsmElementDashboardPage';
import { ExecutivePsmElementRegisterPage } from './ExecutivePsmElementRegisterPage';
import { ExecutivePsmElementDetailPage } from './ExecutivePsmElementDetailPage';
import { ExecutivePsmElementHeatmapPage } from './ExecutivePsmElementHeatmapPage';
import { ExecutivePsmElementGapsPage } from './ExecutivePsmElementGapsPage';
import { ExecutivePsmElementBlockersPage } from './ExecutivePsmElementBlockersPage';
import { ExecutivePsmElementSiteBreakdownPage } from './ExecutivePsmElementSiteBreakdownPage';
import { ExecutivePsmElementUnitBreakdownPage } from './ExecutivePsmElementUnitBreakdownPage';
import { ExecutivePsmElementSnapshotPage } from './ExecutivePsmElementSnapshotPage';
import { ExecutivePsmElementMappingPage } from './ExecutivePsmElementMappingPage';
import { ExecutivePsmElementSettingsPage } from './ExecutivePsmElementSettingsPage';

export {
  ExecutivePsmElementDashboardPage,
  ExecutivePsmElementRegisterPage,
  ExecutivePsmElementDetailPage,
  ExecutivePsmElementHeatmapPage,
  ExecutivePsmElementGapsPage,
  ExecutivePsmElementBlockersPage,
  ExecutivePsmElementSiteBreakdownPage,
  ExecutivePsmElementUnitBreakdownPage,
  ExecutivePsmElementSnapshotPage,
  ExecutivePsmElementMappingPage,
  ExecutivePsmElementSettingsPage,
};

// Aliases for compatibility
export const ExecutivePsmDashboardPage = ExecutivePsmElementDashboardPage;
export const ExecutivePsmRegisterPage = ExecutivePsmElementRegisterPage;
export const ExecutivePsmDetailPage = ExecutivePsmElementDetailPage;

export function ExecutivePsmAnalysisPage({
  mode,
}: {
  mode: 'heatmap' | 'gaps' | 'blockers' | 'site-breakdown' | 'unit-breakdown' | 'snapshots' | 'mapping' | 'settings';
}) {
  switch (mode) {
    case 'heatmap':
      return <ExecutivePsmElementHeatmapPage />;
    case 'gaps':
      return <ExecutivePsmElementGapsPage />;
    case 'blockers':
      return <ExecutivePsmElementBlockersPage />;
    case 'site-breakdown':
      return <ExecutivePsmElementSiteBreakdownPage />;
    case 'unit-breakdown':
      return <ExecutivePsmElementUnitBreakdownPage />;
    case 'snapshots':
      return <ExecutivePsmElementSnapshotPage />;
    case 'mapping':
      return <ExecutivePsmElementMappingPage />;
    case 'settings':
      return <ExecutivePsmElementSettingsPage />;
    default:
      return <ExecutivePsmElementHeatmapPage />;
  }
}
