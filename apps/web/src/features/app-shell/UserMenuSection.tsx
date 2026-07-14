import { UserMenuItem } from './UserMenuItem';
import type { SidebarProfileMenuSection } from './types/sidebar-profile.types';

export function UserMenuSection({ section, onNavigate, onLogout }: { section: SidebarProfileMenuSection; onNavigate: () => void; onLogout: () => void }) {
  if (!section.items.length) return null;
  return (
    <div className="border-t border-[var(--psm-line)] py-2 first:border-t-0 first:pt-0">
      <div className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-[.16em] text-[var(--psm-muted)]">{section.label}</div>
      <div className="space-y-1">
        {section.items.map((item) => <UserMenuItem key={item.key} item={item} onNavigate={onNavigate} onLogout={onLogout} />)}
      </div>
    </div>
  );
}
