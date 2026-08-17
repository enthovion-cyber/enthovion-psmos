import { PsiCard } from '../../shared/PsiUi';

export function LinkedEquipmentSection({ equipment = [], equipmentOptions = [], equipmentSearch = '', onEquipmentSearch, onChange, loading }: { equipment?: Array<Record<string, any>>; equipmentOptions?: Array<Record<string, any>>; equipmentSearch?: string; onEquipmentSearch?: (value: string) => void; onChange?: (equipment: Array<Record<string, any>>) => void; loading?: boolean }) {
  const critical = equipment.filter((link) => link.critical_to_unit || link.equipment?.safetyCritical || link.equipment?.psmCritical).length;
  const missingTechnical = equipment.filter((link) => !link.equipment?.criticality).length;
  const addEquipment = (equipmentId: string) => {
    if (!equipmentId || equipment.some((link) => (link.equipment_id ?? link.equipment?.id) === equipmentId)) return;
    const selected = equipmentOptions.find((option) => option.id === equipmentId);
    onChange?.([...equipment, { equipment_id: equipmentId, relationship_type: 'Unit Equipment', critical_to_unit: Boolean(selected?.safetyCritical || selected?.psmCritical), equipment: selected }]);
  };
  const update = (index: number, patch: Record<string, any>) => onChange?.(equipment.map((link, current) => current === index ? { ...link, ...patch } : link));
  const remove = (index: number) => onChange?.(equipment.filter((_, current) => current !== index));
  return (
    <PsiCard title="6. Linked Equipment Foundation" subtitle="Equipment must belong to the same company/site as the PSI unit.">
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-[var(--psm-line)] p-3"><p className="text-xs text-[var(--psm-muted)]">Equipment count</p><p className="text-2xl font-bold">{equipment.length}</p></div>
        <div className="rounded-lg border border-[var(--psm-line)] p-3"><p className="text-xs text-[var(--psm-muted)]">Critical equipment</p><p className="text-2xl font-bold">{critical}</p></div>
        <div className="rounded-lg border border-[var(--psm-line)] p-3"><p className="text-xs text-[var(--psm-muted)]">Missing technical data</p><p className="text-2xl font-bold">{missingTechnical}</p></div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr]">
        <label className="space-y-1 text-sm font-semibold">Equipment search<input value={equipmentSearch} onChange={(event) => onEquipmentSearch?.(event.target.value)} placeholder="Search equipment by tag, name, type, service" className="w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2" /></label>
        <label className="space-y-1 text-sm font-semibold">Add equipment<select disabled={loading} onChange={(event) => { addEquipment(event.target.value); event.target.value = ''; }} className="w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2"><option value="">{loading ? 'Loading equipment...' : 'Select equipment to link'}</option>{equipmentOptions.map((option) => <option key={option.id} value={option.id}>{option.label ?? option.tag ?? option.name ?? option.id}</option>)}</select></label>
      </div>
      <div className="mt-4 overflow-x-auto rounded-lg border border-[var(--psm-line)]">
        <table className="min-w-full text-sm">
          <thead className="bg-[var(--psm-surface-2)] text-left text-xs uppercase text-[var(--psm-muted)]"><tr><th className="px-3 py-2">Equipment</th><th className="px-3 py-2">Relationship</th><th className="px-3 py-2">Critical</th><th className="px-3 py-2">Primary</th><th className="px-3 py-2">Note</th><th className="px-3 py-2">Actions</th></tr></thead>
          <tbody className="divide-y divide-[var(--psm-line)]">
            {equipment.length ? equipment.map((link, index) => <tr key={`${link.equipment_id ?? link.equipment?.id}-${index}`}>
              <td className="px-3 py-2 font-medium">{link.equipment?.tag ?? link.equipment?.name ?? link.equipment_id}</td>
              <td className="px-3 py-2"><input value={link.relationship_type ?? ''} onChange={(event) => update(index, { relationship_type: event.target.value })} className="w-44 rounded border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-2 py-1" /></td>
              <td className="px-3 py-2"><input type="checkbox" checked={Boolean(link.critical_to_unit)} onChange={(event) => update(index, { critical_to_unit: event.target.checked })} /></td>
              <td className="px-3 py-2"><input type="checkbox" checked={Boolean(link.primary_equipment)} onChange={(event) => update(index, { primary_equipment: event.target.checked })} /></td>
              <td className="px-3 py-2"><input value={link.relationship_note ?? ''} onChange={(event) => update(index, { relationship_note: event.target.value })} className="w-52 rounded border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-2 py-1" /></td>
              <td className="px-3 py-2"><button type="button" onClick={() => remove(index)} className="font-semibold text-danger">Remove</button></td>
            </tr>) : <tr><td colSpan={6} className="px-3 py-6 text-center text-[var(--psm-muted)]">No linked equipment selected yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </PsiCard>
  );
}
