import type { LucideIcon } from 'lucide-react';

export type MarketingNavItem = {
  label: string;
  href: string;
  items?: Array<{ label: string; href: string; description?: string }>;
};

export type MarketingModule = {
  title: string;
  description: string;
  status: string;
  icon: LucideIcon;
  href: string;
};

export type MarketingCtaAction = 'get-started' | 'trial' | 'checkout' | 'contact-sales' | 'login';
