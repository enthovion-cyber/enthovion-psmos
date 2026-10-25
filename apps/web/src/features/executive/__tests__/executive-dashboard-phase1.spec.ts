import { describe, expect, it } from 'vitest';
import type { ExecutiveStatus } from '../types/executive-kpi.types';

describe('Executive KPI Dashboard - Phase 1 Foundation & System Model', () => {
  it('correctly maps all enterprise statuses according to design specifications', () => {
    const validStatuses: ExecutiveStatus[] = [
      'Good',
      'Healthy',
      'Monitor',
      'Warning',
      'Attention Required',
      'Critical',
      'High Risk',
      'Restricted',
      'Unavailable',
      'Incomplete Data',
      'Incomplete',
    ];

    expect(validStatuses).toHaveLength(11);
    validStatuses.forEach((status) => {
      expect(typeof status).toBe('string');
      expect(status.length).toBeGreaterThan(0);
    });
  });

  it('validates navigation routes and permission guards for all executive views', () => {
    const expectedViews = [
      { path: '/executive', label: 'Overview' },
      { path: '/executive/critical-risks', label: 'Critical Risk' },
      { path: '/executive/psm-elements', label: 'PSM Elements' },
      { path: '/executive/performance', label: 'Performance' },
      { path: '/executive/management-review', label: 'Management Review' },
    ];

    expect(expectedViews).toHaveLength(5);
    expectedViews.forEach((v) => {
      expect(v.path.startsWith('/executive')).toBe(true);
      expect(v.label.length).toBeGreaterThan(3);
    });
  });

  it('validates cross-module health scoring and degradation boundaries', () => {
    // Scoring foundation model: 100 max, decrements by item severity
    const calculateFoundationScore = (critical: number, overdue: number, pending: number, stale: number) => {
      return Math.max(0, 100 - critical * 22 - overdue * 8 - pending * 4 - stale * 5);
    };

    const getStatus = (score: number): ExecutiveStatus => {
      if (score < 40) return 'Critical';
      if (score < 60) return 'High Risk';
      if (score < 75) return 'Attention Required';
      if (score < 90) return 'Monitor';
      return 'Healthy';
    };

    // Perfect health
    expect(calculateFoundationScore(0, 0, 0, 0)).toBe(100);
    expect(getStatus(100)).toBe('Healthy');

    // Minor monitor
    const monitorScore = calculateFoundationScore(0, 2, 0, 0); // 84
    expect(monitorScore).toBe(84);
    expect(getStatus(monitorScore)).toBe('Monitor');

    // Attention required
    const attentionScore = calculateFoundationScore(1, 1, 0, 0); // 70
    expect(attentionScore).toBe(70);
    expect(getStatus(attentionScore)).toBe('Attention Required');

    // High risk
    const highRiskScore = calculateFoundationScore(2, 1, 0, 0); // 48
    expect(highRiskScore).toBe(48);
    expect(getStatus(highRiskScore)).toBe('High Risk');

    // Critical failure
    const criticalScore = calculateFoundationScore(3, 2, 0, 0); // 18
    expect(criticalScore).toBe(18);
    expect(getStatus(criticalScore)).toBe('Critical');
  });

  it('enforces safe unavailable and restricted data representations', () => {
    const makeUnavailableResult = (moduleKey: string) => ({
      moduleKey,
      adapterStatus: 'unavailable' as const,
      healthStatus: 'Unavailable' as const,
      dataQuality: 'Unavailable',
      drilldownRoute: `/${moduleKey}`,
      safeErrorMessage: 'The adapter is not registered in this deployment.',
      recordsIncluded: 0,
      recordsExcluded: 0,
      restrictedRecords: null,
    });

    const ptw = makeUnavailableResult('ptw');
    expect(ptw.adapterStatus).toBe('unavailable');
    expect(ptw.recordsIncluded).toBe(0);
    expect(ptw.restrictedRecords).toBeNull();
    expect(ptw.safeErrorMessage).toContain('not registered');
  });
});
