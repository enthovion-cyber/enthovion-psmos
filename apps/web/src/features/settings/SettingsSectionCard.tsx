import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { SettingsNavigationCard } from './types/settings-navigation.types';

export function SettingsSectionCard({ card }: { card: SettingsNavigationCard }) {
  return (
    <Link href={card.href} className="group rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 transition hover:border-info/50 hover:shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">{card.label}</h3>
          <p className="mt-2 text-sm text-[var(--psm-muted)]">{card.description}</p>
        </div>
        <ArrowRight size={17} className="shrink-0 text-[var(--psm-muted)] transition group-hover:translate-x-0.5 group-hover:text-info" />
      </div>
    </Link>
  );
}
