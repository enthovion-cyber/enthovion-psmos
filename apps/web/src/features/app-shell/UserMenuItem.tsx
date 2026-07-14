'use client';

import Link from 'next/link';
import { Bell, BookOpen, Building2, CircleHelp, CreditCard, FileClock, KeyRound, Keyboard, LifeBuoy, LogOut, MapPin, Megaphone, Network, PenLine, Settings, Shield, ShieldCheck, Sparkles, User, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { SidebarProfileMenuItem } from './types/sidebar-profile.types';

const icons: Record<string, LucideIcon> = {
  Bell,
  BookOpen,
  Building2,
  CircleHelp,
  CreditCard,
  FileClock,
  KeyRound,
  Keyboard,
  LifeBuoy,
  LogOut,
  MapPin,
  Megaphone,
  Network,
  PenLine,
  Settings,
  Shield,
  ShieldCheck,
  Sparkles,
  User,
  Users
};

export function UserMenuItem({ item, onNavigate, onLogout }: { item: SidebarProfileMenuItem; onNavigate: () => void; onLogout: () => void }) {
  const Icon = icons[item.icon] ?? CircleHelp;
  const className = `flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
    item.key === 'logout' ? 'text-danger hover:bg-danger/10' : item.disabled ? 'text-[var(--psm-muted)] opacity-60' : 'hover:bg-[var(--psm-surface-3)]'
  }`;
  const body = (
    <>
      <Icon size={15} className="shrink-0" />
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {item.badge ? <span className="rounded bg-[var(--psm-surface-3)] px-1.5 py-0.5 text-[10px] text-[var(--psm-muted)]">{item.badge}</span> : null}
    </>
  );
  if (item.key === 'logout') {
    return <button type="button" className={className} title="Logout and clear this session" onClick={onLogout}>{body}</button>;
  }
  if (item.disabled) {
    return <button type="button" className={className} title={item.disabledReason ?? 'Unavailable'} disabled>{body}</button>;
  }
  return <Link href={item.href} className={className} onClick={onNavigate}>{body}</Link>;
}
