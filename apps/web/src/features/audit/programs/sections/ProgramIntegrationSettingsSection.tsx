import type { AuditProgram } from '../../types/audit.types';
import { Field, inputClass } from '../../shared/AuditUi';

const toggles = [
  ['create_audit_plans_enabled', 'Create audit plans from this program in future phase'],
  ['checklist_builder_enabled', 'Use checklist builder in future phase'],
  ['generate_findings_enabled', 'Generate findings in future phase'],
  ['create_actions_for_findings_enabled', 'Create actions/CAPA for findings'],
  ['link_evidence_from_document_control_enabled', 'Link evidence from Document Control'],
  ['link_findings_to_modules_enabled', 'Link findings to modules'],
  ['include_in_executive_kpi', 'Include in executive KPI dashboard'],
  ['include_in_compliance_scoring', 'Include in compliance scoring']
] as const;

export function ProgramIntegrationSettingsSection({ form, update }: { form: Partial<AuditProgram>; update: (patch: Partial<AuditProgram>) => void }) {
  const settings = ((form as any).integrationSettings ?? {}) as Record<string, any>;
  const patch = (key: string, value: unknown) => update({ ...(form as any), integrationSettings: { ...settings, [key]: value } });
  return <div className="grid gap-4 md:grid-cols-2">{toggles.map(([key, label]) => <Field key={key} label={label}><select className={inputClass()} value={settings[key] === false ? 'No' : 'Yes'} onChange={(e) => patch(key, e.target.value === 'Yes')}><option>Yes</option><option>No</option></select></Field>)}<Field label="Notification settings foundation"><textarea className={inputClass()} value={settings.notification_settings_json ?? ''} onChange={(e) => patch('notification_settings_json', e.target.value)} /></Field><Field label="Report/export settings foundation"><textarea className={inputClass()} value={settings.report_settings_json ?? ''} onChange={(e) => patch('report_settings_json', e.target.value)} /></Field></div>;
}
