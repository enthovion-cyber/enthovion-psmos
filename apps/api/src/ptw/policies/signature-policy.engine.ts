export type SignaturePolicyRequirement = {
  role: string;
  purpose: string;
  status: string;
  userId?: string | null;
  roleId?: string | null;
};

export class SignaturePolicyEngine {
  static calculate(permit: Record<string, any>) {
    const permitType = String(permit.permit_type ?? '').toLowerCase();
    const riskLevel = String(permit.risk_level ?? '').toLowerCase();
    const equipmentCriticality = String(permit.equipment_criticality ?? permit.equipment?.criticality ?? '').toLowerCase();
    const rows: SignaturePolicyRequirement[] = [
      { role: 'Permit Holder', purpose: 'Submit', status: 'Submitted', userId: permit.holder_id ?? null },
      { role: 'Permit Issuer', purpose: 'Approval', status: 'Approved', userId: permit.issuer_id ?? null },
      { role: 'Area Authority', purpose: 'Issue', status: 'Issued', userId: permit.area_authority_id ?? null }
    ];
    const add = (role: string, purpose = 'Approval', status = 'Approved', userId?: string | null, roleId?: string | null) => rows.push({ role, purpose, status, userId: userId ?? null, roleId: roleId ?? null });

    if (permitType.includes('hot')) add('Fire Watch', 'Activation', 'Active');
    if (permitType.includes('confined')) {
      add('Entry Supervisor');
      add('Attendant');
      add('Gas Tester', 'Activation', 'Active');
      add('Rescue Plan Reviewer');
    }
    if (permitType.includes('electrical') || permitType.includes('loto') || permit.isolation_required) {
      add('Isolation Authority', 'Issue', 'Issued');
      add('Electrical Authorized Person', 'Issue', 'Issued');
    }
    if (permitType.includes('excavation')) {
      add('Excavation Competent Person');
      add('Buried Services Reviewer');
    }
    if (permitType.includes('radiography')) {
      add('Radiation Safety Officer');
      add('Control Room Operator', 'Activation', 'Active');
    }
    if (permitType.includes('height')) {
      add('Fall Protection Competent Person');
      add('Rescue Plan Reviewer');
    }
    if (permitType.includes('line') || permitType.includes('opening')) {
      add('Operations Representative');
      add('Maintenance Representative');
      if (permit.gas_test_required) add('Gas Tester', 'Activation', 'Active');
    }
    if (permit.simops_required || permit.conflict_review_required) {
      add('SIMOPS Coordinator');
      add('Control Room Operator', 'Activation', 'Active');
    }
    if (permit.shift_handover_required) {
      add('Outgoing Supervisor', 'Handover', 'Active');
      add('Incoming Supervisor', 'Handover', 'Active');
    }
    if (['high', 'critical'].includes(riskLevel)) add('HSE Reviewer');
    if (equipmentCriticality === 'critical' || equipmentCriticality === 'safety-critical') add('Operations Manager');
    add('Closure Authority', 'Closure', 'Closed');

    const seen = new Set<string>();
    return rows.filter((row) => {
      const key = `${row.role}:${row.purpose}:${row.status}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}
