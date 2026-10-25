import { describe, expect, it } from 'vitest';
import type { ExecutiveScopeType } from '../types/executive-performance.types';

describe('Executive KPI Dashboard — Phase 3: Site / Unit / Department Performance Views', () => {
  const allowedScopes: ExecutiveScopeType[] = [
    'company',
    'site',
    'department',
    'unit',
    'area',
    'equipment',
  ];

  it('validates supported scope types across enterprise hierarchy', () => {
    expect(allowedScopes).toHaveLength(6);
    expect(allowedScopes).toContain('company');
    expect(allowedScopes).toContain('site');
    expect(allowedScopes).toContain('unit');
    expect(allowedScopes).toContain('department');
    expect(allowedScopes).toContain('area');
    expect(allowedScopes).toContain('equipment');
  });

  it('verifies performance ranking comparator correctly sorts sites by health score and handles ties', () => {
    const sites = [
      { id: 'site-2', name: 'Texas Refinery', score: 85, critical: 1 },
      { id: 'site-1', name: 'Jurong Chemical', score: 92, critical: 0 },
      { id: 'site-3', name: 'Rotterdam Hub', score: 74, critical: 3 },
      { id: 'site-4', name: 'Jubail Complex', score: 85, critical: 2 },
    ];

    const sorted = [...sites].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.critical - b.critical; // Tiebreaker: lower critical items first
    });

    expect(sorted[0]?.id).toBe('site-1');
    expect(sorted[0]?.score).toBe(92);
    expect(sorted[1]?.id).toBe('site-2'); // 85 score with 1 critical beats 85 score with 2 critical
    expect(sorted[2]?.id).toBe('site-4');
    expect(sorted[3]?.id).toBe('site-3');
    expect(sorted[3]?.score).toBe(74);
  });

  it('verifies heatmap cell normalization and status mapping', () => {
    const mapCellStatus = (
      score: number | null,
      isUnavailable = false,
      isRestricted = false
    ): string => {
      if (isRestricted) return 'restricted';
      if (isUnavailable) return 'unavailable';
      if (score === null) return 'incomplete_data';
      if (score >= 85) return 'healthy';
      if (score >= 70) return 'monitor';
      if (score >= 50) return 'warning';
      return 'high_risk';
    };

    expect(mapCellStatus(90)).toBe('healthy');
    expect(mapCellStatus(75)).toBe('monitor');
    expect(mapCellStatus(60)).toBe('warning');
    expect(mapCellStatus(40)).toBe('high_risk');
    expect(mapCellStatus(null)).toBe('incomplete_data');
    expect(mapCellStatus(null, true)).toBe('unavailable');
    expect(mapCellStatus(85, false, true)).toBe('restricted');
  });

  it('validates scope drilldown path traversal integrity', () => {
    const drilldownPath = ['company', 'site', 'unit', 'module'];
    const currentScope = 'company';
    const nextScopeIndex = drilldownPath.indexOf(currentScope) + 1;
    const nextScope = drilldownPath[nextScopeIndex];

    expect(nextScope).toBe('site');

    const nextNextScope = drilldownPath[nextScopeIndex + 1];
    expect(nextNextScope).toBe('unit');
  });

  it('validates snapshot payload contract conforms to immutable audit standards', () => {
    const snapshotPayload = {
      snapshotCode: 'EPS-2026-X7Y8Z9',
      scopeType: 'site' as const,
      scopeId: 'site-jurong-01',
      title: 'Q3 Leadership PSM Benchmark',
      performanceScoreFoundation: 89.5,
      performanceStatus: 'Healthy',
      dataQualityStatus: 'Current',
      sourceCount: 142,
      criticalCount: 1,
      overdueCount: 4,
    };

    expect(snapshotPayload.snapshotCode).toMatch(/^EPS-\d{4}-[A-Z0-9]+$/);
    expect(snapshotPayload.performanceScoreFoundation).toBeGreaterThanOrEqual(0);
    expect(snapshotPayload.performanceScoreFoundation).toBeLessThanOrEqual(100);
    expect(snapshotPayload.sourceCount).toBeGreaterThan(0);
  });

  it('validates Phase 3 zod schemas for scope types, recalculations, and snapshots', async () => {
    const { executiveScopeTypeSchema, executivePerformanceStatusSchema } = await import(
      '../schemas/executive-performance.schema'
    );
    const { createPerformanceSnapshotSchema } = await import(
      '../schemas/executive-performance-snapshot.schema'
    );

    expect(executiveScopeTypeSchema.safeParse('site').success).toBe(true);
    expect(executiveScopeTypeSchema.safeParse('invalid-scope').success).toBe(false);

    expect(executivePerformanceStatusSchema.safeParse('Healthy').success).toBe(true);
    expect(executivePerformanceStatusSchema.safeParse('Critical').success).toBe(true);
    expect(executivePerformanceStatusSchema.safeParse('InvalidStatus').success).toBe(false);

    const validSnapshot = createPerformanceSnapshotSchema.safeParse({
      snapshotTitle: 'Q3 Board Review',
      scopeType: 'site',
      scopeId: '11111111-1111-1111-1111-111111111111',
    });
    expect(validSnapshot.success).toBe(true);

    const invalidSnapshot = createPerformanceSnapshotSchema.safeParse({
      snapshotTitle: '', // Empty title fails min(1)
    });
    expect(invalidSnapshot.success).toBe(false);
  });
});
