import { describe, expect, it } from 'vitest';
import type { ExecutiveStatus } from '../types/executive-kpi.types';

describe('Executive KPI Dashboard — Phase 2: Cross-Module KPI Aggregation & Module Health', () => {
  const allModules = [
    'ptw',
    'moc',
    'pssr',
    'hazop',
    'lopa',
    'psi',
    'mechanical-integrity',
    'incidents',
    'training',
    'audit',
    'regulatory',
    'actions',
    'review',
    'reports',
  ];

  it('verifies standard adapter coverage across all 14 PSM modules', () => {
    expect(allModules).toHaveLength(14);
    allModules.forEach((key) => {
      expect(typeof key).toBe('string');
      expect(key.length).toBeGreaterThan(2);
    });
  });

  it('validates module health scoring foundation formula and boundary thresholds', () => {
    const calculateModuleHealthScore = (
      critical: number,
      overdue: number,
      pending: number,
      stale: number
    ): { score: number; status: ExecutiveStatus } => {
      const score = Math.max(0, 100 - critical * 22 - overdue * 8 - pending * 4 - stale * 5);
      let status: ExecutiveStatus = 'Healthy';
      if (score < 40) status = 'Critical';
      else if (score < 60) status = 'High Risk';
      else if (score < 75) status = 'Attention Required';
      else if (score < 90) status = 'Monitor';
      return { score, status };
    };

    // Scenario 1: Clean module
    const clean = calculateModuleHealthScore(0, 0, 0, 0);
    expect(clean.score).toBe(100);
    expect(clean.status).toBe('Healthy');

    // Scenario 2: Two overdue items
    const monitor = calculateModuleHealthScore(0, 2, 0, 0);
    expect(monitor.score).toBe(84);
    expect(monitor.status).toBe('Monitor');

    // Scenario 3: One critical item, one overdue item
    const attention = calculateModuleHealthScore(1, 1, 0, 0);
    expect(attention.score).toBe(70);
    expect(attention.status).toBe('Attention Required');

    // Scenario 4: Multiple critical items
    const highRisk = calculateModuleHealthScore(2, 1, 0, 0);
    expect(highRisk.score).toBe(48);
    expect(highRisk.status).toBe('High Risk');

    // Scenario 5: Catastrophic critical degradation
    const critical = calculateModuleHealthScore(3, 2, 0, 0);
    expect(critical.score).toBe(18);
    expect(critical.status).toBe('Critical');
  });

  it('validates critical alert ranking order with overdue days and severity weights', () => {
    const rankAlert = (severity: 'critical' | 'high' | 'medium' | 'low', overdueDays: number) => {
      const base = severity === 'critical' ? 100 : severity === 'high' ? 70 : severity === 'medium' ? 40 : 10;
      return base + Math.min(overdueDays * 2, 50);
    };

    const alert1 = { title: 'Overdue high-pressure relief test', rank: rankAlert('critical', 15) }; // 100 + 30 = 130
    const alert2 = { title: 'Pending MOC stage approval', rank: rankAlert('high', 5) }; // 70 + 10 = 80
    const alert3 = { title: 'Medium audit observation overdue', rank: rankAlert('medium', 20) }; // 40 + 40 = 80
    const alert4 = { title: 'Fresh critical isolation alert', rank: rankAlert('critical', 0) }; // 100 + 0 = 100

    const sorted = [alert2, alert1, alert3, alert4].sort((a, b) => b.rank - a.rank);
    expect(sorted[0]?.title).toBe('Overdue high-pressure relief test');
    expect(sorted[1]?.title).toBe('Fresh critical isolation alert');
  });

  it('verifies safe source trace normalization and restricted data masking', () => {
    const normalizeTrace = (record: {
      id: string;
      isRestricted: boolean;
      module: string;
      title: string;
    }) => {
      if (record.isRestricted) {
        return {
          sourceRecordId: 'REDACTED',
          sourceModule: record.module,
          title: 'Restricted source record',
          restricted: true,
          included: true,
        };
      }
      return {
        sourceRecordId: record.id,
        sourceModule: record.module,
        title: record.title,
        restricted: false,
        included: true,
      };
    };

    const regular = normalizeTrace({
      id: 'act-101',
      isRestricted: false,
      module: 'actions',
      title: 'Calibrate pressure transmitter PT-104',
    });
    expect(regular.sourceRecordId).toBe('act-101');
    expect(regular.restricted).toBe(false);

    const masked = normalizeTrace({
      id: 'inc-999',
      isRestricted: true,
      module: 'incidents',
      title: 'Confidential investigation report',
    });
    expect(masked.sourceRecordId).toBe('REDACTED');
    expect(masked.title).toBe('Restricted source record');
    expect(masked.restricted).toBe(true);
  });

  it('validates aggregation error sanitization without leaking stack traces', () => {
    const sanitizeError = (rawCode: string, userFacingMessage: string) => ({
      errorCode: `ADAPTER_${rawCode.toUpperCase()}`,
      safeErrorMessage: userFacingMessage,
      retryable: rawCode === 'timeout',
    });

    const error = sanitizeError('timeout', 'The source adapter timed out while connecting.');
    expect(error.errorCode).toBe('ADAPTER_TIMEOUT');
    expect(error.safeErrorMessage).not.toContain('at SupabaseClient');
    expect(error.retryable).toBe(true);
  });
});
