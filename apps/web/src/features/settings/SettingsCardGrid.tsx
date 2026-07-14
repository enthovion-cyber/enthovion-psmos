import { SettingsSectionCard } from './SettingsSectionCard';
import type { SettingsNavigationSection } from './types/settings-navigation.types';

export function SettingsCardGrid({ sections, search }: { sections: SettingsNavigationSection[]; search: string }) {
  const normalized = search.trim().toLowerCase();
  const filtered = sections
    .map((section) => ({
      ...section,
      cards: section.cards.filter((card) => !normalized || `${section.label} ${card.label} ${card.description}`.toLowerCase().includes(normalized))
    }))
    .filter((section) => section.cards.length);
  if (!filtered.length) return <div className="psm-card p-5 text-sm text-[var(--psm-muted)]">No settings match your permissions and search.</div>;
  return (
    <div className="space-y-6">
      {filtered.map((section) => (
        <section key={section.key}>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-[.16em] text-[var(--psm-muted)]">{section.label}</h2>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {section.cards.map((card) => <SettingsSectionCard key={card.key} card={card} />)}
          </div>
        </section>
      ))}
    </div>
  );
}
