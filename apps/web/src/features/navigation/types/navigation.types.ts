export type NavigationItem = {
  label: string;
  href: string;
  moduleKey: string;
  group: 'overview' | 'modules' | 'foundation' | 'admin' | string;
};

export type NavigationResponse = {
  items: NavigationItem[];
  groups: Record<string, NavigationItem[]>;
  permissions: string[];
};
