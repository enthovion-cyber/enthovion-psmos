export function AuthBrand({ compact = false, onDark = false }: { compact?: boolean; onDark?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <img src={onDark ? '/light.svg' : '/dark.svg'} alt="Enthovion logo" className={`shrink-0 object-contain ${compact ? 'h-12 w-12' : 'h-16 w-16'}`} />
      <div className="min-w-0">
        <div className={`font-bold leading-none tracking-[.02em] ${onDark ? 'text-white' : 'text-[var(--brand-navy)] dark:text-white'} ${compact ? 'text-xl' : 'text-3xl'}`}>ENTHOVION</div>
        <div className={`mt-1 font-bold leading-none ${compact ? 'text-2xl' : 'text-4xl'}`}><span className="text-[var(--psm-primary)]">PSM</span><span className={onDark ? 'text-white' : 'text-[var(--brand-navy)] dark:text-white'}> OS</span></div>
        {!compact ? <div className={`mt-1.5 text-[10px] font-semibold uppercase tracking-[.18em] ${onDark ? 'text-slate-300' : 'text-[var(--text-secondary)] dark:text-slate-300'}`}>Process Safety Management</div> : null}
      </div>
    </div>
  );
}
