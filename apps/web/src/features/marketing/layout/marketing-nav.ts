import type { MarketingNavItem } from '../types/marketing.types';

export const navItems: MarketingNavItem[] = [
  {
    label: 'Product',
    href: '/#overview',
    items: [
      { label: 'Overview', href: '/#overview', description: 'Unified PSM workspace' },
      { label: 'How it works', href: '/#workflow', description: 'From workspace setup to report export' },
      { label: 'AI Copilot', href: '/#ai', description: 'AI-assisted decision support' },
      { label: 'PSM OS Modules', href: '/#modules', description: 'Core process safety modules' },
      { label: 'Enterprise Platform', href: '/#platform', description: 'Tenant, site, and RBAC foundation' }
    ]
  },
  { label: 'Features', href: '/features' },
  {
    label: 'Modules',
    href: '/features#modules',
    items: [
      { label: 'MOC', href: '/features#moc' },
      { label: 'PSSR', href: '/features#pssr' },
      { label: 'HAZOP/PHA', href: '/features#hazop' },
      { label: 'LOPA/SIL', href: '/features#lopa' },
      { label: 'Incident Investigation', href: '/features#incidents' },
      { label: 'Mechanical Integrity', href: '/features#mi' },
      { label: 'PTW / Control of Work', href: '/features#ptw' },
      { label: 'Document Control', href: '/features#documents' },
      { label: 'Training', href: '/features#training' },
      { label: 'Audit & Reports', href: '/features#audit' }
    ]
  },
  {
    label: 'Solutions',
    href: '/solutions',
    items: [
      { label: 'Chemical Manufacturing', href: '/solutions#chemical' },
      { label: 'Oil & Gas', href: '/solutions#oil-gas' },
      { label: 'Fertilizer', href: '/solutions#fertilizer' },
      { label: 'Utilities', href: '/solutions#utilities' },
      { label: 'EHS Teams', href: '/solutions#ehs' },
      { label: 'Process Safety Engineers', href: '/solutions#engineers' },
      { label: 'Plant Operations', href: '/solutions#operations' }
    ]
  },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Security', href: '/security' },
  {
    label: 'Resources',
    href: '/faq',
    items: [
      { label: 'Documentation', href: '/#resources' },
      { label: 'Help Center', href: '/faq' },
      { label: 'Blog', href: '/#blog' },
      { label: 'Contact', href: '/contact' },
      { label: 'FAQ', href: '/faq' }
    ]
  }
];
