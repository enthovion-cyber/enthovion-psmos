export function TrustBar() {
  return (
    <section className="border-y border-[var(--psm-line)] bg-[var(--psm-surface)] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-3 text-center text-sm font-bold text-[var(--psm-muted)]">
        {['Chemical plants', 'Petrochemical facilities', 'Refineries', 'LNG facilities', 'Fertilizer plants', 'Industrial manufacturing'].map((item) => <span key={item}>{item}</span>)}
      </div>
    </section>
  );
}
