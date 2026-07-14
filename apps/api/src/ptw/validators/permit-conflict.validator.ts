import { Injectable } from '@nestjs/common';
import { PermitRepository } from '../repositories/permit.repository';

@Injectable()
export class PermitConflictValidator {
  constructor(private readonly repo: PermitRepository) {}

  async detect(tenantId: string, permit: Record<string, any>) {
    const active = await this.repo.db.many<any>(
      this.repo.permits()
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('site_id', permit.site_id)
        .in('status', ['Issued', 'Active', 'Extended'])
        .neq('id', permit.id)
    );
    const matrix = await this.repo.db.many<any>(this.repo.incompatibleMatrix().select('*').eq('tenant_id', tenantId));
    const conflicts: Array<{ type: string; severity: string; description: string; conflictingPermitId: string }> = [];
    for (const other of active) {
      if (permit.equipment_id && other.equipment_id === permit.equipment_id) {
        conflicts.push({ type: 'Equipment', severity: 'High', conflictingPermitId: other.id, description: `${permit.equipment_tag} already has active permit ${other.permit_number}` });
      }
      if (permit.area_id && other.area_id === permit.area_id) {
        const rule = matrix.find((row) =>
          [row.permit_type_a, row.permit_type_b].includes(permit.permit_type) &&
          [row.permit_type_a, row.permit_type_b].includes(other.permit_type)
        );
        if (rule) conflicts.push({ type: 'Area', severity: rule.severity, conflictingPermitId: other.id, description: rule.rule });
      }
    }
    return conflicts;
  }
}
