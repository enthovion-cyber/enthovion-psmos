import { Field, FieldGrid } from '../MaterialCompatibilityPrimitives';
import { PsiCard } from '../../shared/PsiUi';
import type { MaterialCompatibilityDetail } from '../../types/material-compatibility.types';

export function ControlsRestrictionsTab({ detail }: { detail: MaterialCompatibilityDetail }) {
  const row = detail.controls ?? {};
  return <PsiCard title="Controls / Restrictions" subtitle="Operating limits, inspection controls, upgrades, alternate materials, MOC/PSSR blockers, and required action basis."><FieldGrid>{['operating_restrictions','max_temperature_allowed','max_concentration_allowed','ph_range_allowed','required_inspection_control','alternate_material','material_upgrade_required','moc_required','pssr_required','required_action','restriction_basis'].map((key) => <Field key={key} label={key.replaceAll('_', ' ')} value={String(row[key] ?? '') || null} warn={row[key] === null || row[key] === undefined || row[key] === ''} />)}</FieldGrid></PsiCard>;
}

