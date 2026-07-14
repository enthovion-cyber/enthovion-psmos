export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#06111f] text-slate-100">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.15fr_.85fr]">
        <section className="hidden border-r border-line/60 bg-[radial-gradient(circle_at_25%_15%,rgba(47,137,255,.24),transparent_32%),linear-gradient(180deg,#071628,#06111f)] p-12 lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-md bg-info font-bold">PS</div>
              <div>
                <div className="text-xl font-semibold">PSM OS</div>
                <div className="text-sm text-slate-400">Operational Excellence</div>
              </div>
            </div>
          </div>
          <div className="max-w-xl">
            <h1 className="text-5xl font-semibold leading-tight">Process safety work, controlled end to end.</h1>
            <p className="mt-5 text-base text-slate-300">Foundation for multi-site IAM, RBAC, audit trails, documents, workflows, actions, notifications, and search.</p>
          </div>
        </section>
        <section className="flex items-center justify-center p-6">{children}</section>
      </div>
    </main>
  );
}
