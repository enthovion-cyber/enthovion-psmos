import Link from 'next/link';
import { BookOpen, CircleHelp, Keyboard, LifeBuoy, Megaphone } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type HelpCard = {
  title: string;
  href: string;
  description: string;
  icon: LucideIcon;
};

type HelpSection = 'documentation' | 'contact' | 'shortcuts' | 'release-notes';

const cards: HelpCard[] = [
  { title: 'Documentation', href: '/help/documentation', description: 'Product setup notes, workspace guidance, and module references.', icon: BookOpen },
  { title: 'Contact Support', href: '/help/contact', description: 'Send support context to your workspace administrator or support team.', icon: LifeBuoy },
  { title: 'Keyboard Shortcuts', href: '/help/shortcuts', description: 'Command palette and navigation shortcuts for faster work.', icon: Keyboard },
  { title: 'Release Notes', href: '/help/release-notes', description: 'Recent foundation, security, billing, and module changes.', icon: Megaphone }
];

export function HelpCenterPage({ section = 'home' }: { section?: 'home' | HelpSection }) {
  const selected = section === 'home' ? null : cards.find((card) => card.href.endsWith(section));

  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-info/10 text-info"><CircleHelp size={22} /></span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-[var(--psm-muted)]">Help & Support</p>
            <h1 className="mt-1 text-2xl font-black text-[var(--psm-text)]">{selected?.title ?? 'Help Center'}</h1>
          </div>
        </div>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-[var(--psm-muted)]">
          Find support resources for workspace setup, access, billing, security, shortcuts, and operational module workflows.
        </p>
      </header>

      {section === 'home' ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => <HelpTile key={card.href} card={card} />)}
        </div>
      ) : (
        <HelpDetail section={section} />
      )}
    </section>
  );
}

function HelpTile({ card }: { card: HelpCard }) {
  const Icon = card.icon;
  return (
    <Link href={card.href} className="group rounded-2xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-info/40 hover:shadow-md">
      <span className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--psm-surface-2)] text-info"><Icon size={20} /></span>
      <h2 className="mt-4 font-black text-[var(--psm-text)]">{card.title}</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--psm-muted)]">{card.description}</p>
      <span className="mt-4 inline-flex text-sm font-bold text-info group-hover:underline">Open</span>
    </Link>
  );
}

function HelpDetail({ section }: { section: HelpSection }) {
  const content: Record<HelpSection, { title: string; items: string[] }> = {
    documentation: {
      title: 'Documentation Topics',
      items: ['Workspace and site setup', 'User access and permission model', 'Billing, trial, and entitlement behavior', 'Audit logs and security event review', 'PSM module operating guides']
    },
    contact: {
      title: 'Contact Support',
      items: ['Include your company, site, module, and record number when reporting an issue.', 'For account lockout or billing issues, contact a Company Admin or Billing Admin.', 'For access issues, include the route and expected permission.']
    },
    shortcuts: {
      title: 'Keyboard Shortcuts',
      items: ['Ctrl K opens global search and command palette.', 'Use the sidebar module links for permission-filtered navigation.', 'Use company and site switchers in the topbar to refresh scoped data.']
    },
    'release-notes': {
      title: 'Release Notes',
      items: ['SaaS foundation routes, billing, sidebar footer profile, and public marketing CTA flow integrated.', 'Tenant/site isolation guards and permission-aware navigation connected across core modules.', 'Incident and LOPA module build-out continues behind guarded app routes.']
    }
  };
  const selected = content[section];

  return (
    <div className="rounded-2xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-6 shadow-sm">
      <h2 className="text-lg font-black">{selected.title}</h2>
      <div className="mt-5 grid gap-3">
        {selected.items.map((item) => (
          <div key={item} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4 text-sm leading-6 text-[var(--psm-muted)]">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
