import { Activity, AlertTriangle, CheckCircle2, Clock, FileText, ShieldCheck, type LucideIcon } from 'lucide-react';

type Kpi = {
  label: string;
  value: string;
  sub: string;
  Icon: LucideIcon;
  color: string;
};

const kpis: Kpi[] = [
  { label: 'Overall Safety Status', value: 'GOOD', sub: 'All systems operational', Icon: ShieldCheck, color: 'text-success' },
  { label: 'PSM Health Score', value: '87%', sub: '+5% vs last month', Icon: Activity, color: 'text-success' },
  { label: 'Open Actions', value: '342', sub: '18 vs last month', Icon: Clock, color: 'text-warning' },
  { label: 'Overdue Actions', value: '78', sub: '7 vs last month', Icon: AlertTriangle, color: 'text-danger' },
  { label: 'Active Permits', value: '126', sub: '11 vs last month', Icon: FileText, color: 'text-info' }
];

export default function DashboardPage() {
  return (
    <div className="space-y-5">
      <section className="grid grid-cols-5 gap-3">
        {kpis.map(({ label, value, sub, Icon, color }) => (
          <div key={label} className="psm-panel rounded-lg p-4">
            <div className="mb-4 flex items-center justify-between text-xs uppercase tracking-wide text-slate-400">
              {label}
              <Icon className={color} size={18} />
            </div>
            <div className={`text-3xl font-semibold ${color}`}>{value}</div>
            <div className="mt-1 text-sm text-slate-400">{sub}</div>
          </div>
        ))}
      </section>
      <section className="grid grid-cols-[1.05fr_.95fr] gap-5">
        <div className="psm-panel rounded-lg p-5">
          <h2 className="mb-4 text-base font-semibold">Foundation Readiness</h2>
          <div className="grid grid-cols-2 gap-3">
            {['Multi-tenancy', 'RBAC', 'Audit logging', 'Workflow engine', 'Action engine', 'Document control', 'Search', 'Notifications'].map((item) => (
              <div key={item} className="rounded-md border border-line/70 bg-[#071523] px-3 py-3 text-sm">
                <CheckCircle2 className="mr-2 inline text-success" size={16} />
                {item}
              </div>
            ))}
          </div>
        </div>
        <div className="psm-panel rounded-lg p-5">
          <h2 className="mb-4 text-base font-semibold">Mandatory Build Order</h2>
          <div className="space-y-3 text-sm">
            {['Step 1 Foundation', 'Step 2 Equipment Registry', 'Step 3 Workflow + Action Engines', 'Step 4 Permit to Work', 'Step 5 MOC', 'Step 6 HAZOP', 'Step 7 PSSR', 'Step 8 Hazard Reporting'].map((step, index) => (
              <div key={step} className="flex items-center gap-3">
                <span className={`grid h-7 w-7 place-items-center rounded-full ${index === 0 ? 'bg-success text-[#04140e]' : 'bg-[#071523] text-slate-400'}`}>{index + 1}</span>
                <span className={index === 0 ? 'text-slate-100' : 'text-slate-400'}>{step}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
