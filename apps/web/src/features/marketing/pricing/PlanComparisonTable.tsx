import type { PublicPlan } from '../types/public-plan.types';

export function PlanComparisonTable({ plans }: { plans: PublicPlan[] }) {
  const rows = ['Core PSM modules', 'Multi-site support', 'Advanced permissions', 'Reports/export', 'Priority support'];
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--psm-line)] bg-[var(--psm-surface)]">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-[var(--psm-surface-2)] text-left">
            <tr>
              <th className="px-4 py-3 font-black">Capability</th>
              {plans.map((plan) => <th key={plan.code} className="px-4 py-3 font-black">{plan.name}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--psm-line)]">
            {rows.map((row) => {
              const matchToken = row.split(' ')[0] ?? row;
              return (
                <tr key={row}>
                  <td className="px-4 py-3 font-semibold">{row}</td>
                  {plans.map((plan) => <td key={`${plan.code}-${row}`} className="px-4 py-3 text-[var(--psm-muted)]">{plan.features.some((feature) => feature.toLowerCase().includes(matchToken.toLowerCase())) ? 'Included' : plan.code === 'enterprise' ? 'Custom' : 'Plan dependent'}</td>)}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
