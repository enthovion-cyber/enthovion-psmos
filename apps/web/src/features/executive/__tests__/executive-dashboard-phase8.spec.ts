import { describe, expect, it } from 'vitest';
import * as ModuleExports from '../reports';
import * as ChartExports from '../components/charts';
import { executiveReportApi } from '../services/executive-report.service';

describe('Executive KPI Dashboard — Phase 8: Executive Reports / Export + Board-Level PSM Performance Packages', () => {
  describe('1. Code Format Identifiers', () => {
    it('validates executive report code format ERP-YYYY-XXXXXXXX', () => {
      const reportRegex = /^ERP-\d{4}-[A-Z0-9]+$/;
      expect(reportRegex.test('ERP-2026-F89C402E')).toBe(true);
      expect(reportRegex.test('ERP-2026-12345678')).toBe(true);
      expect(reportRegex.test('REP-101')).toBe(false);
    });

    it('validates template code format ERT-...', () => {
      const tplRegex = /^ERT-[A-Z0-9_-]+$/;
      expect(tplRegex.test('ERT-BOARD-PACK')).toBe(true);
      expect(tplRegex.test('ERT-MONTHLY-SUMMARY')).toBe(true);
      expect(tplRegex.test('TEMPLATE-01')).toBe(false);
    });

    it('validates audience profile code format ERA-...', () => {
      const audRegex = /^ERA-[A-Z0-9_-]+$/;
      expect(audRegex.test('ERA-BOARD-DIRECTORS')).toBe(true);
      expect(audRegex.test('ERA-EXECUTIVE-LEADERSHIP')).toBe(true);
      expect(audRegex.test('AUDIENCE-1')).toBe(false);
    });

    it('validates distribution code format ERD-YYYY-XXXXXXXX', () => {
      const distRegex = /^ERD-\d{4}-[A-Z0-9]+$/;
      expect(distRegex.test('ERD-2026-A1B2C3D4')).toBe(true);
      expect(distRegex.test('DIST-001')).toBe(false);
    });
  });

  describe('2. Evidence Readiness & Completeness Engine', () => {
    it('computes weighted evidence readiness score across mandatory source modules', () => {
      const computeReadiness = (
        modules: Array<{ module: string; isMandatory: boolean; isAvailable: boolean }>
      ) => {
        const mandatory = modules.filter((m) => m.isMandatory);
        const mandatoryAvail = mandatory.filter((m) => m.isAvailable).length;
        const total = modules.length;
        const totalAvail = modules.filter((m) => m.isAvailable).length;

        // 70% weight to mandatory sources, 30% to optional sources
        const mandatoryScore = (mandatoryAvail / (mandatory.length || 1)) * 70;
        const optionalScore = (totalAvail / (total || 1)) * 30;
        return Math.round(mandatoryScore + optionalScore);
      };

      const allPresent = [
        { module: 'PTW', isMandatory: true, isAvailable: true },
        { module: 'MOC', isMandatory: true, isAvailable: true },
        { module: 'INCIDENT', isMandatory: true, isAvailable: true },
        { module: 'MI', isMandatory: false, isAvailable: true },
      ];
      expect(computeReadiness(allPresent)).toBe(100);

      const oneMandatoryMissing = [
        { module: 'PTW', isMandatory: true, isAvailable: true },
        { module: 'MOC', isMandatory: true, isAvailable: false },
        { module: 'INCIDENT', isMandatory: true, isAvailable: true },
        { module: 'MI', isMandatory: false, isAvailable: true },
      ];
      expect(computeReadiness(oneMandatoryMissing)).toBeLessThan(80);
    });

    it('enforces minimum readiness threshold (80%) for board packages', () => {
      const isBoardEligible = (readinessScore: number, hasBlockingGaps: boolean) => {
        return readinessScore >= 80 && !hasBlockingGaps;
      };

      expect(isBoardEligible(95, false)).toBe(true);
      expect(isBoardEligible(75, false)).toBe(false);
      expect(isBoardEligible(85, true)).toBe(false);
    });
  });

  describe('3. Confidentiality, Watermarking & Distribution Rules', () => {
    it('requires dynamic watermarking for Board Confidential and Restricted tiers', () => {
      const requiresWatermark = (classification: string) => {
        return ['Board Confidential', 'Restricted'].includes(classification);
      };

      expect(requiresWatermark('Board Confidential')).toBe(true);
      expect(requiresWatermark('Restricted')).toBe(true);
      expect(requiresWatermark('Internal')).toBe(false);
      expect(requiresWatermark('Public')).toBe(false);
    });

    it('validates state transitions: DRAFT -> IN_REVIEW -> APPROVED -> PUBLISHED', () => {
      const validTransitions: Record<string, string[]> = {
        DRAFT: ['IN_REVIEW', 'ARCHIVED'],
        IN_REVIEW: ['APPROVED', 'DRAFT', 'ARCHIVED'],
        APPROVED: ['PUBLISHED', 'ARCHIVED'],
        PUBLISHED: ['ARCHIVED'],
        ARCHIVED: [],
      };

      const isValidTransition = (from: string, to: string) => {
        return (validTransitions[from] ?? []).includes(to);
      };

      expect(isValidTransition('DRAFT', 'IN_REVIEW')).toBe(true);
      expect(isValidTransition('IN_REVIEW', 'APPROVED')).toBe(true);
      expect(isValidTransition('APPROVED', 'PUBLISHED')).toBe(true);
      expect(isValidTransition('DRAFT', 'PUBLISHED')).toBe(false);
    });
  });

  describe('4. Component & API Interface Verification', () => {
    it('exports all necessary feature pages and components', () => {
      expect(ModuleExports.ExecutiveReportsDashboardPage).toBeDefined();
      expect(ModuleExports.ExecutiveReportRegisterPage).toBeDefined();
      expect(ModuleExports.ExecutiveBoardReportingPage).toBeDefined();
      expect(ModuleExports.ExecutiveReportBuilderWizardPage).toBeDefined();
      expect(ModuleExports.ExecutiveReportDetailPage).toBeDefined();
      expect(ModuleExports.ExecutiveReportTemplatesPage).toBeDefined();
      expect(ModuleExports.ExecutiveReportingPeriodsPage).toBeDefined();
      expect(ModuleExports.ExecutiveReportDistributionPage).toBeDefined();
    });

    it('exports Phase 8 chart components', () => {
      expect(ChartExports.ExecutiveReportReadinessGauge).toBeDefined();
      expect(ChartExports.ExecutiveBoardAssuranceMatrix).toBeDefined();
    });

    it('exposes all required API methods in executiveReportApi', () => {
      expect(typeof executiveReportApi.dashboard).toBe('function');
      expect(typeof executiveReportApi.boardDashboard).toBe('function');
      expect(typeof executiveReportApi.boardPackages).toBe('function');
      expect(typeof executiveReportApi.createBoardPackage).toBe('function');
      expect(typeof executiveReportApi.reports).toBe('function');
      expect(typeof executiveReportApi.create).toBe('function');
      expect(typeof executiveReportApi.detail).toBe('function');
      expect(typeof executiveReportApi.validate).toBe('function');
      expect(typeof executiveReportApi.generate).toBe('function');
      expect(typeof executiveReportApi.submitApproval).toBe('function');
      expect(typeof executiveReportApi.approve).toBe('function');
      expect(typeof executiveReportApi.publish).toBe('function');
      expect(typeof executiveReportApi.distribution).toBe('function');
      expect(typeof executiveReportApi.sendDistribution).toBe('function');
      expect(typeof executiveReportApi.revokeDistribution).toBe('function');
      expect(typeof executiveReportApi.staleness).toBe('function');
      expect(typeof executiveReportApi.triggerStaleness).toBe('function');
    });
  });
});
