import { Injectable } from '@nestjs/common';

type ConditionRule = {
  field?: string;
  operator?: 'eq' | 'neq' | 'in' | 'not_in' | 'exists' | 'gte' | 'lte';
  value?: unknown;
  all?: ConditionRule[];
  any?: ConditionRule[];
};

@Injectable()
export class ConditionRuleEngine {
  matches(rule: unknown, context: Record<string, unknown>): boolean {
    if (!rule) return true;
    const condition = rule as ConditionRule;
    if (Array.isArray(condition.all)) return condition.all.every((item: ConditionRule) => this.matches(item, context));
    if (Array.isArray(condition.any)) return condition.any.some((item: ConditionRule) => this.matches(item, context));
    if (!condition.field) return true;
    const actual = this.lookup(context, condition.field);
    const operator = condition.operator ?? 'eq';
    if (operator === 'exists') return actual !== undefined && actual !== null && actual !== '';
    if (operator === 'eq') return String(actual) === String(condition.value);
    if (operator === 'neq') return String(actual) !== String(condition.value);
    if (operator === 'in') return Array.isArray(condition.value) && condition.value.map(String).includes(String(actual));
    if (operator === 'not_in') return Array.isArray(condition.value) && !condition.value.map(String).includes(String(actual));
    if (operator === 'gte') return Number(actual) >= Number(condition.value);
    if (operator === 'lte') return Number(actual) <= Number(condition.value);
    return true;
  }

  private lookup(context: Record<string, unknown>, path: string) {
    return path.split('.').reduce<unknown>((value, key) => {
      if (value && typeof value === 'object' && key in value) return (value as Record<string, unknown>)[key];
      return undefined;
    }, context);
  }
}
