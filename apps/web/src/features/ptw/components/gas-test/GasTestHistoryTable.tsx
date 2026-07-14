import { CheckCircle2, Edit, ShieldCheck, Trash2, ChevronDown, ListFilter } from 'lucide-react';
import { useState } from 'react';
import type { PermitGasTest } from '../../services/ptw-gas-test.service';

export function GasTestHistoryTable({ 
  tests, 
  onEdit, 
  onDelete, 
  onValidate 
}: { 
  tests: PermitGasTest[]; 
  onEdit: (test: PermitGasTest) => void; 
  onDelete: (id: string) => void; 
  onValidate: (id: string) => void 
}) {
  const [showAll, setShowAll] = useState(false);

  // Limit display list to 4 rows unless "View All" is checked/clicked
  const displayedTests = showAll ? tests : tests.slice(0, 4);
  const hasMoreThanFour = tests.length > 4;

  return (
    <section className="rounded-xl border border-slate-800/80 bg-slate-900 p-5 shadow-2xl backdrop-blur-md">
      {/* Header section with styling accents matching your dark aesthetic */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListFilter size={16} className="text-sky-400" />
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Gas Test History
            </h3>
            <p className="text-[11px] text-slate-400">
              Atmospheric monitoring log records
            </p>
          </div>
        </div>
        <span className="rounded-full border border-slate-700/60 bg-slate-950 px-3 py-1 text-xs font-semibold tracking-wide text-slate-300 shadow-sm">
          {tests.length} {tests.length === 1 ? 'record' : 'records'}
        </span>
      </div>

      {tests.length ? (
        <div className="space-y-3">
          {/* Custom Styled Scrollable Container */}
          <div 
            className="overflow-auto rounded-lg border border-slate-800/60 bg-slate-950/40 max-h-[500px]
              [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2
              [&::-webkit-scrollbar-track]:bg-slate-950/60
              [&::-webkit-scrollbar-track]:rounded-lg
              [&::-webkit-scrollbar-thumb]:bg-slate-800
              [&::-webkit-scrollbar-thumb]:rounded-lg
              hover:[&::-webkit-scrollbar-thumb]:bg-slate-700
              [&::-webkit-scrollbar-corner]:bg-transparent"
          >
            <table className="w-full min-w-[1250px] text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-950/90 border-b border-slate-800 sticky top-0 z-20 backdrop-blur-md">
                  {[
                    'Test date/time', 'Test type', 'Tester', 'Instrument ID', 
                    'O2', 'LEL', 'H2S', 'CO', 'Result', 'Next re-test due', 'Actions'
                  ].map((head) => (
                    <th 
                      key={head} 
                      className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 select-none"
                    >
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {displayedTests.map((test) => {
                  const statusStr = test.result_status ?? test.result ?? 'Unknown';
                  return (
                    <tr 
                      key={test.id} 
                      className="group hover:bg-slate-800/30 transition-colors duration-150 ease-in-out"
                    >
                      <td className="px-4 py-3 text-slate-300 font-medium">
                        {new Date(test.tested_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-slate-300 font-semibold text-xs tracking-wide">
                        {test.test_type ?? '-'}
                      </td>
                      <td className="px-4 py-3 text-slate-300 font-medium">
                        {test.tester_name ?? test.tester_user_id ?? '-'}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-400">
                        {test.instrument_id ?? '-'}
                      </td>
                      <td className="px-4 py-3 font-mono font-semibold text-emerald-400">{value(test, 'O2')}</td>
                      <td className="px-4 py-3 font-mono font-semibold text-amber-400">{value(test, 'LEL')}</td>
                      <td className="px-4 py-3 font-mono font-semibold text-orange-400">{value(test, 'H2S')}</td>
                      <td className="px-4 py-3 font-mono font-semibold text-rose-400">{value(test, 'CO')}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Status status={statusStr} />
                      </td>
                      <td className="px-4 py-3 text-xs font-medium text-slate-400">
                        {test.next_retest_due_at || test.next_test_due_at ? (
                          new Date(test.next_retest_due_at ?? test.next_test_due_at ?? '').toLocaleString()
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                      
                      {/* Actions Column matching styling profiles */}
                      <td className="px-4 py-3 sticky right-0 z-10 bg-slate-900/90 group-hover:bg-slate-850 backdrop-blur-md border-l border-slate-800/40 transition-colors duration-150 shadow-[-15px_0_20px_-10px_rgba(2,6,23,0.6)]">
                        <div className="flex items-center gap-1.5 pl-1">
                          <button 
                            className="grid h-8 w-8 place-items-center rounded-lg border border-sky-500/20 text-sky-400 transition-all duration-150 active:scale-95 hover:bg-sky-500/20 hover:border-sky-500/40 hover:text-sky-300"
                            onClick={() => onValidate(test.id)} 
                            title="Validate"
                          >
                            <ShieldCheck size={14} />
                          </button>
                          <button 
                            className="grid h-8 w-8 place-items-center rounded-lg border border-slate-800 text-slate-400 transition-all duration-150 active:scale-95 hover:border-slate-600 hover:text-slate-200 hover:bg-slate-800"
                            onClick={() => onEdit(test)} 
                            title="Edit"
                          >
                            <Edit size={14} />
                          </button>
                          <button 
                            className="grid h-8 w-8 place-items-center rounded-lg border border-rose-500/20 text-rose-400 transition-all duration-150 active:scale-95 hover:bg-rose-500/20 hover:border-rose-500/40 hover:text-rose-300"
                            onClick={() => onDelete(test.id)} 
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Elegant View Toggle Control */}
          {hasMoreThanFour && (
            <div className="flex justify-center pt-2 border-t border-slate-800/40">
              <button
                type="button"
                onClick={() => setShowAll(!showAll)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950/60 px-4 py-2 text-xs font-semibold tracking-wide text-slate-300 transition-all hover:bg-slate-800 hover:text-slate-200 active:scale-98"
              >
                {showAll ? 'Show Less' : `View All History (${tests.length})`}
                <ChevronDown size={14} className={`transition-transform duration-200 ${showAll ? 'rotate-180' : ''}`} />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/20 p-8 text-center text-sm text-slate-500">
          No gas test history records found for this permit tracker.
        </div>
      )}
    </section>
  );
}

function value(test: PermitGasTest, code: string) {
  const reading = test.readings?.find((item) => item.gas_code.toUpperCase() === code);
  return reading ? `${reading.value} ${reading.unit}` : '-';
}

function Status({ status }: { status: string }) {
  let tone = 'border-slate-800 bg-slate-950 text-slate-400';
  
  if (status === 'Pass') {
    tone = 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400';
  } else if (['Fail', 'Calibration Expired', 'Overdue'].includes(status)) {
    tone = 'border-rose-500/20 bg-rose-500/10 text-rose-400';
  } else if (status !== 'Unknown') {
    tone = 'border-amber-500/20 bg-amber-500/10 text-amber-400';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-semibold tracking-wide select-none backdrop-blur-sm ${tone}`}>
      <CheckCircle2 size={12} className="opacity-80" /> 
      {status}
    </span>
  );
}