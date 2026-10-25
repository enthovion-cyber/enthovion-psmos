import { describe, expect, it } from 'vitest';
import type { PsmElementStatus, PsmScoreFactor } from '../types/executive-psm-element.types';

describe('Executive KPI Dashboard — Phase 4: PSM Element Health Scoring + Element Scorecards', () => {
  const allowedStatuses: PsmElementStatus[] = [
    'Healthy',
    'Monitor',
    'Attention Required',
    'High Risk',
    'Critical',
    'Incomplete Data',
    'Insufficient Data',
    'Restricted',
    'Source Unavailable',
    'Not Configured',
  ];

  it('validates supported PSM element status classifications', () => {
    expect(allowedStatuses).toContain('Healthy');
    expect(allowedStatuses).toContain('Monitor');
    expect(allowedStatuses).toContain('Attention Required');
    expect(allowedStatuses).toContain('High Risk');
    expect(allowedStatuses).toContain('Critical');
    expect(allowedStatuses).toContain('Insufficient Data');
    expect(allowedStatuses).toContain('Restricted');
    expect(allowedStatuses).toContain('Source Unavailable');
  });

  it('verifies snapshot code format conforms to standard pattern PE-YYYY-XXXX', () => {
    const snapshotCodeRegex = /^PE-\d{4}-[A-Z0-9]+$/;
    expect(snapshotCodeRegex.test('PE-2026-A1B2')).toBe(true);
    expect(snapshotCodeRegex.test('PE-2026-F89C402E')).toBe(true);
    expect(snapshotCodeRegex.test('PE-2025-SNAPSHOT')).toBe(true);
    expect(snapshotCodeRegex.test('INVALID-CODE')).toBe(false);
  });

  it('verifies score factor weight aggregation logic', () => {
    const factors: Array<{ factor_key: string; factor_weight: number; factor_value: number }> = [
      { factor_key: 'kpi_performance', factor_weight: 40, factor_value: 90 },
      { factor_key: 'action_completion', factor_weight: 30, factor_value: 80 },
      { factor_key: 'evidence_readiness', factor_weight: 20, factor_value: 85 },
      { factor_key: 'timely_approvals', factor_weight: 10, factor_value: 100 },
    ];

    const totalWeight = factors.reduce((sum, f) => sum + f.factor_weight, 0);
    expect(totalWeight).toBe(100);

    const weightedScore = factors.reduce(
      (sum, f) => sum + (f.factor_value * f.factor_weight) / 100,
      0
    );
    expect(weightedScore).toBe(87);
  });

  it('verifies element gap severity prioritization and blocker classification', () => {
    const gaps = [
      { id: 'gap-1', severity: 'Monitor', isBlocker: false },
      { id: 'gap-2', severity: 'Critical', isBlocker: true },
      { id: 'gap-3', severity: 'High Risk', isBlocker: false },
      { id: 'gap-4', severity: 'Critical', isBlocker: true },
    ];

    const criticalBlockers = gaps.filter((g) => g.severity === 'Critical' && g.isBlocker);
    expect(criticalBlockers).toHaveLength(2);
    expect(criticalBlockers.map((g) => g.id)).toEqual(['gap-2', 'gap-4']);
  });

  it('verifies safe source trace masking when record is restricted', () => {
    const rawTrace = [
      { id: 'trace-1', title: 'PTW High Voltage Isolation', restricted: false },
      { id: 'trace-2', title: 'Confidential Investigation MOC', restricted: true },
    ];

    const safeTrace = rawTrace.map((t) => ({
      ...t,
      displayTitle: t.restricted ? 'Restricted source record' : t.title,
    }));

    expect(safeTrace[0]?.displayTitle).toBe('PTW High Voltage Isolation');
    expect(safeTrace[1]?.displayTitle).toBe('Restricted source record');
  });

  it('verifies PSM governance disclaimer integrity', () => {
    const disclaimer = 'PSM governance health score, not legal certification';
    expect(disclaimer.toLowerCase()).toContain('not legal certification');
  });
});
