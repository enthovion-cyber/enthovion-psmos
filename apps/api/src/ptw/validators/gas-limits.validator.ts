import { BadRequestException, Injectable } from '@nestjs/common';
import { PermitRepository } from '../repositories/permit.repository';

type GasInput = Record<string, any>;

@Injectable()
export class GasLimitsValidator {
  constructor(private readonly repo: PermitRepository) {}

  gasTestRequired(permit: Record<string, any>) {
    const requiredControls = permit.required_controls ?? {};
    if (requiredControls.gasTest === true || requiredControls.gas_test === true) return true;
    if (['HOT_WORK', 'CONFINED_SPACE', 'LINE_BREAKING'].includes(permit.permit_type)) return true;
    if (permit.permit_type === 'EXCAVATION' && (permit.area_classification || permit.risk_level === 'High')) return true;
    return false;
  }

  async applicableThresholds(tenantId: string, permit: Record<string, any>) {
    const rows = await this.repo.db.many<any>(
      this.repo.thresholds()
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .or(`site_id.is.null,site_id.eq.${permit.site_id}`)
        .or(`permit_type.is.null,permit_type.eq.${permit.permit_type}`)
    );
    const priority = (row: any) => (row.site_id ? 4 : 0) + (row.permit_type ? 2 : 0) + (row.area_classification ? 1 : 0);
    const byGas = new Map<string, any>();
    for (const row of rows) {
      const gasCode = String(row.gas_code ?? row.gas_key).toUpperCase();
      const current = byGas.get(gasCode);
      if (!current || priority(row) >= priority(current)) byGas.set(gasCode, this.normalizeThreshold(row));
    }
    return Array.from(byGas.values()).sort((a, b) => a.gas_code.localeCompare(b.gas_code));
  }

  async evaluate(tenantId: string, permit: Record<string, any>, reading: GasInput) {
    const thresholds = await this.applicableThresholds(tenantId, permit);
    const values = this.readingValues(reading);
    const failures: string[] = [];
    const missing: string[] = [];
    const required = this.gasTestRequired(permit) ? ['O2', 'LEL'] : [];
    for (const gasCode of required) {
      const value = values[gasCode];
      if (value === undefined || value === null || Number.isNaN(Number(value))) missing.push(gasCode);
    }
    for (const threshold of thresholds) {
      const gasCode = String(threshold.gas_code ?? threshold.gas_key).toUpperCase();
      const value = values[gasCode];
      if (value === undefined || value === null || Number.isNaN(Number(value))) continue;
      if (threshold.min_limit !== null && threshold.min_limit !== undefined && Number(value) < Number(threshold.min_limit)) failures.push(`${gasCode} below ${threshold.min_limit}${threshold.unit}`);
      if (threshold.max_limit !== null && threshold.max_limit !== undefined && Number(value) > Number(threshold.max_limit)) failures.push(`${gasCode} above ${threshold.max_limit}${threshold.unit}`);
    }
    if (permit.permit_type === 'HOT_WORK' && values.LEL !== undefined && Number(values.LEL) > 0) {
      failures.push('Hot work default policy requires 0% LEL unless site override is approved');
    }
    const calibrationExpiry = reading.calibrationExpiryDate ?? reading.calibration_expiry_date ?? reading.calibrationDueDate ?? reading.calibration_due_date;
    const testedAt = new Date(reading.testedAt ?? reading.tested_at ?? Date.now());
    const calibrationExpired = calibrationExpiry ? new Date(calibrationExpiry).getTime() < testedAt.getTime() : false;
    if (calibrationExpired) failures.push('Instrument calibration is expired');
    const result = calibrationExpired ? 'Calibration Expired' : missing.length ? 'Incomplete' : failures.length ? 'Fail' : 'Pass';
    const interval = this.retestIntervalMinutes(thresholds, permit);
    const nextRetestDueAt = result === 'Pass' ? new Date(testedAt.getTime() + interval * 60 * 1000).toISOString() : null;
    return { result, failures, missing, thresholds, interval, nextRetestDueAt, values };
  }

  assertRequired(permit: Record<string, any>, reading: { o2?: number; lel?: number }) {
    if (this.gasTestRequired(permit) && (reading.o2 === undefined || reading.lel === undefined)) {
      throw new BadRequestException('O2 and LEL readings are required for this permit type');
    }
  }

  readingValues(reading: GasInput) {
    const values: Record<string, number> = {};
    for (const key of ['o2', 'lel', 'h2s', 'co', 'so2', 'cl2', 'nh3', 'hf']) {
      const value = reading[key] ?? reading[key.toUpperCase()];
      if (value !== undefined && value !== null && value !== '') values[key.toUpperCase()] = Number(value);
    }
    for (const item of reading.readings ?? []) {
      if (item?.gasCode && item.value !== undefined && item.value !== null && item.value !== '') values[String(item.gasCode).toUpperCase()] = Number(item.value);
    }
    for (const [key, value] of Object.entries(reading.customGases ?? reading.custom_gases ?? {})) {
      if (value !== undefined && value !== null && value !== '') values[String(key).toUpperCase()] = Number(value);
    }
    return values;
  }

  retestIntervalMinutes(thresholds: any[], permit: Record<string, any>) {
    const configured = thresholds.map((row) => Number(row.retest_interval_minutes)).filter(Boolean);
    if (configured.length) return Math.min(...configured);
    if (permit.permit_type === 'CONFINED_SPACE' || permit.permit_type === 'LINE_BREAKING') return 60;
    if (permit.permit_type === 'HOT_WORK') return 120;
    return 0;
  }

  normalizeThreshold(row: any) {
    return {
      ...row,
      gas_code: row.gas_code ?? row.gas_key,
      gas_name: row.gas_name ?? row.gas_key,
      unit: row.unit ?? row.units,
      min_limit: row.min_limit ?? row.min_value,
      max_limit: row.max_limit ?? row.max_value
    };
  }
}
