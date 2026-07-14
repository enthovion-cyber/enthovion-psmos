export type SettingsNavigationCard = {
  key: string;
  label: string;
  href: string;
  description: string;
  requiredAny?: string[];
  visible?: boolean;
};

export type SettingsNavigationSection = {
  key: string;
  label: string;
  cards: SettingsNavigationCard[];
};

export type SettingsNavigationResponse = {
  sections: SettingsNavigationSection[];
  permissions: string[];
};
