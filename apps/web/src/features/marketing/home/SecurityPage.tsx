import { SecuritySection } from './SecuritySection';

export function SecurityPage() {
  return (
    <main>
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-black uppercase tracking-[.18em] text-blue-500">Security</p>
          <h1 className="mt-3 max-w-4xl text-5xl font-black tracking-normal">Company/site isolation, RBAC, audit history, and secure evidence patterns.</h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-[var(--psm-muted)]">Enthovion PSM OS is designed so sensitive company, site, document, action, incident, and approval data are governed by backend authorization and tenant-aware workflows.</p>
        </div>
      </section>
      <SecuritySection />
    </main>
  );
}
