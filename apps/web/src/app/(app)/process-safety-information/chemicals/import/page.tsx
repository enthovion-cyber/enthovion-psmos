import { PsiCard } from '@/features/psi/shared/PsiUi';

export default function PsiChemicalImportPage() {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase text-primary">Chemicals & SDS</p>
        <h1 className="text-2xl font-bold">Import Chemicals</h1>
        <p className="mt-2 text-sm text-[var(--psm-muted)]">CSV/XLSX import foundation uses backend validation, preview, row errors, audit, and history before commit.</p>
      </div>
      <PsiCard title="Import Template" subtitle="Use the import-template API for exact columns and validation rules.">
        <p className="text-sm text-[var(--psm-muted)]">Required core columns include unit_code, chemical_name, process_use, max_intended_inventory, inventory_unit, and SDS/hazard fields where available. No fake import data is shown.</p>
      </PsiCard>
    </div>
  );
}
