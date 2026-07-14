import type { LopaDetailStudy } from './lopa-detail.types';

export type LopaTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export type LopaOverviewSummaryCard = {
  key: string;
  label: string;
  value: string | number | boolean | null;
  tone: LopaTone;
  tab?: string;
};

export type LopaReadinessCheck = {
  key: string;
  label: string;
  status: 'Complete' | 'Incomplete' | 'Warning' | 'Blocked' | 'Not Applicable' | string;
  complete: boolean;
};

export type LopaBlocker = {
  id: string;
  title: string;
  description: string;
  severity: 'Hard' | 'Soft' | string;
  tab: string;
};

export type LopaQuickAction = {
  key: string;
  label: string;
  enabled: boolean;
  reason?: string;
  tab?: string;
};

export type LopaOverview = {
  header: LopaDetailStudy & { readOnly: boolean; overdue: boolean; sourceChanged: boolean };
  permissions: Record<string, boolean>;
  readOnly: boolean;
  summaryCards: LopaOverviewSummaryCard[];
  sourceSnapshot: any | null;
  metadata: Record<string, any>;
  consequence: Record<string, any>;
  initiatingEvent: Record<string, any>;
  safeguards: { totalImported: number; safeguardOnly: number; iplCandidates: number; validationNotStarted: number; validationFailed: number; validated: number; credited: number; hazopSourceCount: number; rows: any[] };
  librarySelections?: { initiatingEvent: any | null; conditionalModifiers: any[] };
  calculation: Record<string, any>;
  sil: Record<string, any>;
  readiness: { status: string; complete: number; total: number; blocked: number; warnings: number; checklist: LopaReadinessCheck[] };
  blockers: LopaBlocker[];
  actions: any[];
  linkedRecords: Array<{ type: string; count: number; status: string; restricted: boolean }>;
  recentActivity: any[];
  quickActions: LopaQuickAction[];
};
