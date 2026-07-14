import { Save, Settings2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { GasThresholdValues } from '../../schemas/gas-test.schema';
import type { GasThreshold } from '../../services/ptw-gas-test.service';

const defaults: GasThresholdValues = {
  gasCode: 'O2',
  gasName: 'Oxygen',
  unit: '%',
  minLimit: 19.5,
  maxLimit: 23.5,
  retestIntervalMinutes: 120,
  autoSuspendOnFail: true,
  autoSuspendOnOverdue: true,
  isActive: true,
  policy: ''
};

export function SiteGasThresholdPanel({ 
  thresholds, 
  onCreate, 
  onUpdate, 
  onDelete 
}: { 
  thresholds: GasThreshold[]; 
  onCreate: (values: GasThresholdValues) => void; 
  onUpdate: (id: string, values: GasThresholdValues) => void; 
  onDelete: (id: string) => void 
}) {
  const [editing, setEditing] = useState<GasThreshold | null>(null);
  const [values, setValues] = useState<GasThresholdValues>(defaults);

  function edit(row: GasThreshold) {
    setEditing(row);
    setValues({
      siteId: row.site_id ?? undefined,
      permitType: row.permit_type ?? undefined,
      areaClassification: row.area_classification ?? undefined,
      gasCode: row.gas_code ?? row.gas_key ?? '',
      gasName: row.gas_name ?? '',
      unit: row.unit ?? row.units ?? 'ppm',
      minLimit: row.min_limit ?? row.min_value ?? undefined,
      maxLimit: row.max_limit ?? row.max_value ?? undefined,
      alertLimit: row.alert_limit ?? undefined,
      actionLimit: row.action_limit ?? undefined,
      retestIntervalMinutes: row.retest_interval_minutes ?? 120,
      autoSuspendOnFail: row.auto_suspend_on_fail ?? true,
      autoSuspendOnOverdue: row.auto_suspend_on_overdue ?? true,
      isActive: row.is_active ?? true,
      policy: row.policy ?? ''
    });
  }

  function save() {
    if (editing) onUpdate(editing.id, values);
    else onCreate(values);
    setEditing(null);
    setValues(defaults);
  }

  return (
    <section className="rounded-xl border border-slate-800/80 bg-slate-900 p-5 shadow-2xl backdrop-blur-md">
      {/* Panel Top Heading Strip */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-200">
          <Settings2 size={16} className="text-sky-400" /> 
          Site Gas Thresholds
        </div>
        <span className="text-xs font-medium text-slate-400">
          Configure thresholds and re-test intervals
        </span>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        {/* Table Overflow Container with Luxury Webkit Custom Scrollbars */}
        <div 
          className="overflow-auto rounded-lg border border-slate-800/60 bg-slate-950/40 max-h-[580px]
            [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2
            [&::-webkit-scrollbar-track]:bg-slate-950/60
            [&::-webkit-scrollbar-track]:rounded-lg
            [&::-webkit-scrollbar-thumb]:bg-slate-800
            [&::-webkit-scrollbar-thumb]:rounded-lg
            hover:[&::-webkit-scrollbar-thumb]:bg-slate-700
            [&::-webkit-scrollbar-corner]:bg-transparent"
        >
          <table className="w-full min-w-[860px] text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-950/90 border-b border-slate-800 sticky top-0 z-20 backdrop-blur-md">
                {['Gas', 'Permit Type', 'Limits', 'Retest', 'Auto Suspend', 'Policy', 'Actions'].map((head) => (
                  <th key={head} className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 select-none">
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {thresholds.map((row) => (
                <tr key={row.id} className="group hover:bg-slate-800/30 transition-colors duration-150 ease-in-out">
                  <td className="px-4 py-3 font-mono font-bold text-sky-400 tracking-wide">
                    {row.gas_code ?? row.gas_key}
                  </td>
                  <td className="px-4 py-3 text-slate-300 font-medium">
                    {row.permit_type ?? 'All'}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-emerald-400">
                    {formatLimits(row)}
                  </td>
                  <td className="px-4 py-3 text-slate-300 font-medium">
                    {row.retest_interval_minutes ?? 0} min
                  </td>
                  <td className="px-4 py-3 text-xs font-medium text-slate-400">
                    <span className={row.auto_suspend_on_fail ? 'text-rose-400 font-semibold' : ''}>
                      {row.auto_suspend_on_fail ? 'Fail' : '-'}
                    </span>
                    <span className="text-slate-600 mx-1">/</span>
                    <span className={row.auto_suspend_on_overdue ? 'text-amber-400 font-semibold' : ''}>
                      {row.auto_suspend_on_overdue ? 'Overdue' : '-'}
                    </span>
                  </td>
                  <td className="max-w-[260px] truncate px-4 py-3 text-xs text-slate-400 font-medium">
                    {row.policy ?? '-'}
                  </td>
                  
                  {/* Sticky Table Row Interactive Controls Strip */}
                  <td className="px-4 py-3 sticky right-0 z-10 bg-slate-900/90 group-hover:bg-slate-850 backdrop-blur-md border-l border-slate-800/40 transition-colors duration-150 shadow-[-15px_0_20px_-10px_rgba(2,6,23,0.6)]">
                    <div className="flex gap-1.5">
                      <button 
                        className="rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-1 text-xs font-semibold text-slate-300 transition-all duration-150 active:scale-95 hover:bg-slate-800 hover:border-slate-600 hover:text-slate-100" 
                        onClick={() => edit(row)}
                      >
                        Edit
                      </button>
                      <button 
                        className="grid h-7 w-7 place-items-center rounded-lg border border-rose-500/20 text-rose-400 transition-all duration-150 active:scale-95 hover:bg-rose-500/20 hover:border-rose-500/40 hover:text-rose-300" 
                        onClick={() => onDelete(row.id)}
                        title="Delete Threshold"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Configuration Action Card Form Panel Container */}
        <div className="rounded-xl border border-slate-800/60 bg-slate-950/30 p-4 shadow-inner backdrop-blur-sm">
          <div className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-300 border-b border-slate-800/60 pb-2">
            {editing ? 'Edit Existing Threshold' : 'Register New Threshold'}
          </div>
          <div className="grid gap-3">
            <Input label="Gas Code" value={values.gasCode} onChange={(gasCode) => setValues({ ...values, gasCode })} />
            <Input label="Gas Name" value={values.gasName ?? ''} onChange={(gasName) => setValues({ ...values, gasName })} />
            <Input label="Unit" value={values.unit} onChange={(unit) => setValues({ ...values, unit })} />
            <Input label="Permit Type" value={values.permitType ?? ''} onChange={(permitType) => setValues({ ...values, permitType: permitType || undefined })} />
            
            <div className="grid grid-cols-2 gap-2">
              <Input label="Min Limit" type="number" value={String(values.minLimit ?? '')} onChange={(value) => setValues({ ...values, minLimit: value === '' ? undefined : Number(value) })} />
              <Input label="Max Limit" type="number" value={String(values.maxLimit ?? '')} onChange={(value) => setValues({ ...values, maxLimit: value === '' ? undefined : Number(value) })} />
            </div>

            <Input label="Retest Interval Minutes" type="number" value={String(values.retestIntervalMinutes ?? 0)} onChange={(value) => setValues({ ...values, retestIntervalMinutes: Number(value) })} />
            
            {/* Styled Configuration Option Checkboxes */}
            <div className="mt-1 space-y-2 rounded-lg border border-slate-800/60 bg-slate-950/50 p-2.5">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-300 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={values.autoSuspendOnFail} 
                  onChange={(event) => setValues({ ...values, autoSuspendOnFail: event.target.checked })} 
                  className="h-3.5 w-3.5 rounded border-slate-800 bg-slate-900 text-sky-500 accent-sky-500 focus:ring-0 focus:ring-offset-0"
                /> 
                Auto suspend permit on fail
              </label>
              <label className="flex items-center gap-2 text-xs font-medium text-slate-300 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={values.autoSuspendOnOverdue} 
                  onChange={(event) => setValues({ ...values, autoSuspendOnOverdue: event.target.checked })} 
                  className="h-3.5 w-3.5 rounded border-slate-800 bg-slate-900 text-sky-500 accent-sky-500 focus:ring-0 focus:ring-offset-0"
                /> 
                Auto suspend permit on overdue
              </label>
            </div>

            <label className="block">
              <span className="text-xs font-semibold text-slate-400">Internal Policy Note</span>
              <textarea 
                className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:border-sky-500/50 focus:outline-none focus:ring-0 min-h-20 transition-all duration-150 resize-none" 
                placeholder="Ex: Mandatory ventilation rules for confined entries..." 
                value={values.policy ?? ''} 
                onChange={(event) => setValues({ ...values, policy: event.target.value })} 
              />
            </label>

            <button 
              className="mt-1 flex items-center justify-center gap-1.5 w-full rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs py-2.5 tracking-wide shadow-md transition-all duration-150 active:scale-98" 
              onClick={save}
            >
              <Save size={14} /> 
              Save Threshold Configuration
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Input({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-slate-400">{label}</span>
      <input 
        className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:border-sky-500/50 focus:outline-none focus:ring-0 transition-all duration-150" 
        type={type} 
        value={value} 
        onChange={(event) => onChange(event.target.value)} 
      />
    </label>
  );
}

function formatLimits(row: GasThreshold) {
  const unit = row.unit ?? row.units ?? '';
  const min = row.min_limit ?? row.min_value ?? null;
  const max = row.max_limit ?? row.max_value ?? null;
  if (min !== null && max !== null) return `${min} - ${max} ${unit}`;
  if (max !== null) return `< ${max} ${unit}`;
  if (min !== null) return `> ${min} ${unit}`;
  return 'Configured';
}