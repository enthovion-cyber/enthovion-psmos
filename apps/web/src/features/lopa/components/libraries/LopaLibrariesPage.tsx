'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { Calculator, GitBranch, ShieldCheck } from 'lucide-react';
import { LopaLibraryHeader } from './LopaLibraryHeader';
import { LopaLibraryNavigation } from './LopaLibraryNavigation';

export function LopaLibrariesPage() {
  return (
    <main className="space-y-4 pb-8 text-slate-100">
      <style jsx global>{`
        .lopa-button-primary { display:inline-flex; align-items:center; gap:.45rem; border-radius:.55rem; background:#2563eb; padding:.58rem .85rem; font-size:.82rem; font-weight:700; color:white; box-shadow:0 18px 40px rgba(37,99,235,.18); }
        .lopa-button-secondary { display:inline-flex; align-items:center; gap:.45rem; border-radius:.55rem; border:1px solid rgba(103,232,249,.14); background:rgba(15,35,58,.9); padding:.55rem .8rem; font-size:.82rem; font-weight:700; color:#dbeafe; }
      `}</style>
      <LopaLibraryHeader title="LOPA / SIL Library Management" subtitle="Govern initiating event frequencies and conditional modifiers with approval, revision control, source references, and study snapshots." />
      <LopaLibraryNavigation active="home" />
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <LibraryCard href="/lopa/libraries/initiating-events" icon={<GitBranch size={22} />} title="Initiating Event Library" body="Corporate and site-approved initiating event frequencies with uncertainty ranges, source references, review status, and revision control." />
        <LibraryCard href="/lopa/libraries/conditional-modifiers" icon={<Calculator size={22} />} title="Conditional Modifier Library" body="Approved probability and exposure factors for LOPA calculations with range control, justification rules, and study snapshot support." />
        <LibraryCard href="/lopa/ipl-registry" icon={<ShieldCheck size={22} />} title="IPL Registry" body="Govern independent protection layer definitions, validation criteria, PFD/RRF basis, proof tests, documents, approvals, and revisions." />
      </section>
      <section className="rounded-xl border border-cyan-300/10 bg-[#071525] p-5">
        <div className="flex items-center gap-2 text-sm font-bold text-white"><ShieldCheck size={16} /> Governance Rules</div>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          {['Draft and rejected records cannot be used in governed calculations.', 'Approved records are immutable; create a revision for changes.', 'Every study selection snapshots the selected value and source reference.'].map((text) => <div key={text} className="rounded-lg border border-cyan-300/10 bg-[#03101d] p-4 text-sm text-slate-300">{text}</div>)}
        </div>
      </section>
    </main>
  );
}

function LibraryCard({ href, icon, title, body }: { href: string; icon: ReactNode; title: string; body: string }) {
  return (
    <Link href={href} className="rounded-xl border border-cyan-300/10 bg-[#071525] p-5 shadow-xl shadow-black/10 transition hover:border-blue-400/30 hover:bg-[#102845]">
      <div className="flex items-center gap-3 text-blue-300">{icon}<h2 className="text-lg font-black text-white">{title}</h2></div>
      <p className="mt-3 text-sm leading-6 text-slate-400">{body}</p>
    </Link>
  );
}
