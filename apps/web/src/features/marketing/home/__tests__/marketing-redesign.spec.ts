import { describe, expect, it } from 'vitest';
import { modules, featureCards, aiFeatures, workflowSteps, securityItems } from '../marketing-content';
import { navItems } from '../../layout/marketing-nav';

describe('Marketing Redesign & Platform Consistency', () => {
  it('covers all 10 core PSM elements with valid routes', () => {
    expect(modules.length).toBe(10);
    const titles = modules.map((m) => m.title);
    expect(titles).toContain('MOC');
    expect(titles).toContain('PSSR');
    expect(titles).toContain('HAZOP/PHA');
    expect(titles).toContain('LOPA/SIL');
    expect(titles).toContain('Incident Investigation');
    expect(titles).toContain('Mechanical Integrity');
    expect(titles).toContain('PTW / Control of Work');
    expect(titles).toContain('Document Control');
    expect(titles).toContain('Training');
    expect(titles).toContain('Audit & Reports');

    modules.forEach((mod) => {
      expect(mod.href).toMatch(/^\/features(#.+)?$/);
      expect(mod.description.length).toBeGreaterThan(10);
      expect(mod.status.length).toBeGreaterThan(3);
    });
  });

  it('contains valid navigation links including overview, modules, pricing and security', () => {
    const labels = navItems.map((item) => item.label);
    expect(labels).toContain('Product');
    expect(labels).toContain('Features');
    expect(labels).toContain('Modules');
    expect(labels).toContain('Solutions');
    expect(labels).toContain('Pricing');
    expect(labels).toContain('Security');
  });

  it('defines structured platform features and multi-discipline team roles', () => {
    expect(featureCards.length).toBe(4);
    expect(aiFeatures.length).toBeGreaterThanOrEqual(5);
    expect(workflowSteps.length).toBe(7);
    expect(securityItems.length).toBe(6);
  });
});
