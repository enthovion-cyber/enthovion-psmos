const lifecycle = ['Draft', 'Submitted', 'Approved', 'Issued', 'Active', 'Suspended', 'Extended', 'Closed', 'Cancelled'];

export function PermitLifecycleStepper({ status }: { status: string }) {
  const activeIndex = lifecycle.indexOf(status);
  return (
    <div className="overflow-auto">
      <div className="flex min-w-[760px] items-center">
        {lifecycle.map((step, index) => {
          const active = step === status;
          const done = activeIndex >= 0 && index < activeIndex && !['Suspended', 'Cancelled'].includes(status);
          return (
            <div key={step} className="flex flex-1 items-center">
              <div className={`grid h-7 w-7 place-items-center rounded-full border text-xs font-bold ${active ? 'border-primary bg-primary text-white' : done ? 'border-success bg-success text-white' : 'border-[var(--psm-line)] text-[var(--psm-muted)]'}`}>{index + 1}</div>
              <div className={`ml-2 text-xs font-semibold ${active ? 'text-primary' : done ? 'text-success' : 'text-[var(--psm-muted)]'}`}>{step}</div>
              {index < lifecycle.length - 1 ? <div className={`mx-3 h-px flex-1 ${done ? 'bg-success' : 'bg-[var(--psm-line)]'}`} /> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
