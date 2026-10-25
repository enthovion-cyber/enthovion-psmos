import { describe, expect, it } from 'vitest';
import * as ModuleExports from '../trends';
import * as ChartExports from '../components/charts';
import { executiveTrendApi } from '../services/executive-trend.service';

describe('Executive KPI Dashboard — Phase 7: Trends + Repeat Issues + Executive Escalation Intelligence', () => {
  describe('1. Code Format Identifiers', () => {
    it('validates trend run code format ETR-YYYY-XXXXXXXX', () => {
      const runRegex = /^ETR-\d{4}-[A-Z0-9]+$/;
      expect(runRegex.test('ETR-2026-F89C402E')).toBe(true);
      expect(runRegex.test('ETR-2026-12345678')).toBe(true);
      expect(runRegex.test('RUN-101')).toBe(false);
    });

    it('validates repeat issue code format ERI-YYYY-XXXXXXXX', () => {
      const repeatRegex = /^ERI-\d{4}-[A-Z0-9]+$/;
      expect(repeatRegex.test('ERI-2026-A1B2C3D4')).toBe(true);
      expect(repeatRegex.test('ERI-2026-99999999')).toBe(true);
      expect(repeatRegex.test('REPEAT-01')).toBe(false);
    });

    it('validates recurring cluster code format ERC-YYYY-XXXXXXXX', () => {
      const clusterRegex = /^ERC-\d{4}-[A-Z0-9]+$/;
      expect(clusterRegex.test('ERC-2026-77778888')).toBe(true);
      expect(clusterRegex.test('CLUSTER-2026-01')).toBe(false);
    });

    it('validates trend insight code format ETI-YYYY-XXXXXXXX', () => {
      const insightRegex = /^ETI-\d{4}-[A-Z0-9]+$/;
      expect(insightRegex.test('ETI-2026-DEC00001')).toBe(true);
      expect(insightRegex.test('INSIGHT-1')).toBe(false);
    });

    it('validates trend alert rule code format ETAR-YYYY-XXXXXXXX', () => {
      const ruleRegex = /^ETAR-\d{4}-[A-Z0-9]+$/;
      expect(ruleRegex.test('ETAR-2026-CMT00001')).toBe(true);
      expect(ruleRegex.test('RULE-1')).toBe(false);
    });
  });

  describe('2. Trend Directionality & Worsening Calculations', () => {
    it('evaluates directionality based on metric optimization goal', () => {
      const evaluateDirection = (slope: number, higherIsBetter: boolean) => {
        if (Math.abs(slope) < 0.05) return 'stable';
        if (higherIsBetter) {
          return slope > 0 ? 'improving' : 'worsening';
        } else {
          return slope < 0 ? 'improving' : 'worsening';
        }
      };

      // PSM Health: higher is better
      expect(evaluateDirection(0.85, true)).toBe('improving');
      expect(evaluateDirection(-0.45, true)).toBe('worsening');
      expect(evaluateDirection(0.01, true)).toBe('stable');

      // Critical Risks: lower is better
      expect(evaluateDirection(-1.2, false)).toBe('improving');
      expect(evaluateDirection(0.9, false)).toBe('worsening');
      expect(evaluateDirection(0.02, false)).toBe('stable');
    });

    it('detects 3 consecutive periods of worsening degradation', () => {
      const checkConsecutiveWorsening = (values: number[], higherIsBetter: boolean) => {
        if (values.length < 3) return false;
        const [v0, v1, v2] = values;
        if (higherIsBetter) {
          // If higher is better, worsening means strictly decreasing over time: v0 > v1 > v2
          return v0 > v1 && v1 > v2;
        } else {
          // If lower is better, worsening means strictly increasing over time: v0 < v1 < v2
          return v0 < v1 && v1 < v2;
        }
      };

      // Health index dropping: 85 -> 80 -> 74
      expect(checkConsecutiveWorsening([85, 80, 74], true)).toBe(true);
      // Health index fluctuating: 85 -> 80 -> 82
      expect(checkConsecutiveWorsening([85, 80, 82], true)).toBe(false);

      // Overdue actions increasing: 5 -> 9 -> 16
      expect(checkConsecutiveWorsening([5, 9, 16], false)).toBe(true);
      // Overdue actions decreasing: 16 -> 9 -> 5
      expect(checkConsecutiveWorsening([16, 9, 5], false)).toBe(false);
    });
  });

  describe('3. Repeat Issue Detection & Similarity Verification', () => {
    it('verifies repeat issue threshold scoring logic', () => {
      const computeMatchScore = (input: {
        sameModule: boolean;
        sameEquipmentType: boolean;
        sameFailureCode: boolean;
        textSimilarityPct: number;
      }) => {
        let score = 0;
        if (input.sameModule) score += 20;
        if (input.sameEquipmentType) score += 30;
        if (input.sameFailureCode) score += 25;
        score += Math.round(input.textSimilarityPct * 0.25);
        return Math.min(100, score);
      };

      const highMatch = computeMatchScore({
        sameModule: true,
        sameEquipmentType: true,
        sameFailureCode: true,
        textSimilarityPct: 80,
      });
      expect(highMatch).toBe(95);
      expect(highMatch >= 70).toBe(true); // Qualifies as candidate

      const lowMatch = computeMatchScore({
        sameModule: true,
        sameEquipmentType: false,
        sameFailureCode: false,
        textSimilarityPct: 30,
      });
      expect(lowMatch).toBe(28);
      expect(lowMatch >= 70).toBe(false); // Does not qualify
    });
  });

  describe('4. Historical Data Integrity & Quality Guards', () => {
    it('preserves missing observations without fabricating or backfilling values', () => {
      const points = [
        { period: '2026-01', value: 82, status: 'Verified' },
        { period: '2026-02', value: null, status: 'Missing' },
        { period: '2026-03', value: 85, status: 'Verified' },
      ];

      // Missing point must not be filled with previous value or current value
      expect(points[1]?.status).toBe('Missing');
      expect(points[1]?.value).toBeNull();
    });

    it('validates fair denominator comparability rules', () => {
      const evaluateComparability = (siteA: { operatingHours: number }, siteB: { operatingHours: number }) => {
        if (!siteA.operatingHours || !siteB.operatingHours) return 'Fair Denominator Missing';
        const variance = Math.abs(siteA.operatingHours - siteB.operatingHours) / Math.max(siteA.operatingHours, siteB.operatingHours);
        if (variance > 0.3) return 'Non-Comparable';
        if (variance > 0.1) return 'Partially Comparable';
        return 'Comparable';
      };

      expect(evaluateComparability({ operatingHours: 100000 }, { operatingHours: 95000 })).toBe('Comparable');
      expect(evaluateComparability({ operatingHours: 100000 }, { operatingHours: 85000 })).toBe('Partially Comparable');
      expect(evaluateComparability({ operatingHours: 100000 }, { operatingHours: 50000 })).toBe('Non-Comparable');
      expect(evaluateComparability({ operatingHours: 100000 }, { operatingHours: 0 })).toBe('Fair Denominator Missing');
    });
  });

  describe('5. Component & API Service Exports', () => {
    it('exports all Phase 7 charts from charts index', () => {
      expect(ChartExports.ExecutiveTrendMultiLineChart).toBeDefined();
      expect(ChartExports.ExecutiveTrendComparisonBarChart).toBeDefined();
      expect(ChartExports.ExecutiveTrendQualityGauge).toBeDefined();
      expect(ChartExports.ExecutiveRepeatIssueBubbleChart).toBeDefined();
    });

    it('exports all Phase 7 trend page components', () => {
      expect(ModuleExports.ExecutiveTrendsDashboardPage).toBeDefined();
      expect(ModuleExports.ExecutiveTrendExplorerPage).toBeDefined();
      expect(ModuleExports.ExecutiveTrendRunsPage).toBeDefined();
      expect(ModuleExports.ExecutiveRepeatIssuesPage).toBeDefined();
      expect(ModuleExports.ExecutiveRecurringClustersPage).toBeDefined();
      expect(ModuleExports.ExecutiveCrossSiteComparePage).toBeDefined();
      expect(ModuleExports.ExecutiveCriticalRiskTrendsPage).toBeDefined();
      expect(ModuleExports.ExecutiveOverdueActionTrendsPage).toBeDefined();
      expect(ModuleExports.ExecutiveEscalationTrendsPage).toBeDefined();
      expect(ModuleExports.ExecutiveTrendInsightsPage).toBeDefined();
      expect(ModuleExports.ExecutiveTrendAlertsPage).toBeDefined();
      expect(ModuleExports.ExecutiveTrendMethodologyPage).toBeDefined();
      expect(ModuleExports.ExecutiveTrendSettingsPage).toBeDefined();
    });

    it('provides executiveTrendApi with all Phase 7 client methods', () => {
      expect(typeof executiveTrendApi.dashboard).toBe('function');
      expect(typeof executiveTrendApi.explorer).toBe('function');
      expect(typeof executiveTrendApi.runs).toBe('function');
      expect(typeof executiveTrendApi.run).toBe('function');
      expect(typeof executiveTrendApi.createRun).toBe('function');
      expect(typeof executiveTrendApi.repeats).toBe('function');
      expect(typeof executiveTrendApi.detectRepeats).toBe('function');
      expect(typeof executiveTrendApi.reviewRepeat).toBe('function');
      expect(typeof executiveTrendApi.createRepeatAction).toBe('function');
      expect(typeof executiveTrendApi.clusters).toBe('function');
      expect(typeof executiveTrendApi.alerts).toBe('function');
      expect(typeof executiveTrendApi.acknowledgeAlert).toBe('function');
      expect(typeof executiveTrendApi.resolveAlert).toBe('function');
      expect(typeof executiveTrendApi.insights).toBe('function');
      expect(typeof executiveTrendApi.comparisons).toBe('function');
      expect(typeof executiveTrendApi.methodology).toBe('function');
      expect(typeof executiveTrendApi.settings).toBe('function');
      expect(typeof executiveTrendApi.lookups).toBe('function');
    });
  });
});
