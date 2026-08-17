import { EquipmentDesignFieldGrid, valueOf } from '../EquipmentDesignFieldGrid';
import { PsiCard } from '../../shared/PsiUi';
import type { EquipmentDesignDetail } from '../../types/equipment-design.types';

export function CodesStandardsTab({ detail }: { detail: EquipmentDesignDetail }) {
  const codes = detail.codes;
  return (
    <PsiCard title="Codes / Standards" subtitle="Design, construction, inspection, relief, electrical/instrument, company, licensor, vendor, and regulatory standards.">
      <EquipmentDesignFieldGrid items={[
        { label: 'Design code', value: valueOf(codes, 'design_code'), tone: valueOf(codes, 'design_code') === 'Not provided' ? 'warn' : 'normal' },
        { label: 'Code edition', value: valueOf(codes, 'code_edition') },
        { label: 'Construction code', value: valueOf(codes, 'construction_code') },
        { label: 'Inspection code', value: valueOf(codes, 'inspection_code') },
        { label: 'Relief design code reference', value: valueOf(codes, 'relief_design_code_reference') },
        { label: 'Electrical / instrument standard', value: valueOf(codes, 'electrical_instrument_standard_reference') },
        { label: 'Company standard', value: valueOf(codes, 'company_standard') },
        { label: 'Licensor standard', value: valueOf(codes, 'licensor_standard') },
        { label: 'Vendor standard', value: valueOf(codes, 'vendor_standard') },
        { label: 'Regulatory requirement', value: valueOf(codes, 'regulatory_requirement') },
        { label: 'Certification requirement', value: valueOf(codes, 'certification_requirement') },
        { label: 'Registration number', value: valueOf(codes, 'design_registration_number') }
      ]} />
    </PsiCard>
  );
}
