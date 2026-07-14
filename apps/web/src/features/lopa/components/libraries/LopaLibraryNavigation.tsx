import Link from 'next/link';

export function LopaLibraryNavigation({ active }: { active?: 'home' | 'initiating' | 'modifier' | 'ipl' }) {
  const items = [
    ['home', '/lopa/libraries', 'Library Command Center'],
    ['initiating', '/lopa/libraries/initiating-events', 'Initiating Event Library'],
    ['modifier', '/lopa/libraries/conditional-modifiers', 'Conditional Modifier Library'],
    ['ipl', '/lopa/ipl-registry', 'IPL Registry']
  ] as const;
  return (
    <nav className="flex overflow-x-auto rounded-xl border border-cyan-300/10 bg-[#071525] p-1">
      {items.map(([key, href, label]) => (
        <Link key={key} href={href} className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold transition ${active === key ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-blue-500/10 hover:text-white'}`}>{label}</Link>
      ))}
    </nav>
  );
}
