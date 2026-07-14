import { securityItems } from './marketing-content';

export function SecuritySection() {
  return (
    <section id="platform" className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-sm font-black uppercase tracking-[.18em] text-blue-500">Security & Compliance</p>
          <h2 className="mt-3 text-4xl font-black tracking-normal">Enterprise controls for audit-ready industrial governance.</h2>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {securityItems.map((item) => (
            <div key={item.title} className="rounded-2xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5">
              <item.icon className="text-blue-500" size={22} />
              <h3 className="mt-4 text-lg font-black">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--psm-muted)]">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
