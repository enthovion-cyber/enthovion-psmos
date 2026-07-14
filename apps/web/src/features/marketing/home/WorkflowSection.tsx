import { workflowSteps } from './marketing-content';

export function WorkflowSection() {
  return (
    <section id="workflow" className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-sm font-black uppercase tracking-[.18em] text-blue-500">How Enthovion PSM OS works</p>
          <h2 className="mt-3 text-4xl font-black tracking-normal">From workspace setup to signed, exportable evidence.</h2>
        </div>
        <div className="mt-10 grid gap-3 lg:grid-cols-7">
          {workflowSteps.map((step, index) => (
            <div key={step} className="relative rounded-2xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-blue-600 text-sm font-black text-white">{index + 1}</span>
              <h3 className="mt-4 text-sm font-black leading-5">{step}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
