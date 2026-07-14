export type SidebarProfileMenuItem = {
  key: string;
  label: string;
  href: string;
  icon: string;
  visible: boolean;
  disabled: boolean;
  disabledReason?: string;
  badge?: string;
};

export type SidebarProfileMenuSection = {
  key: string;
  label: string;
  items: SidebarProfileMenuItem[];
};

export type SidebarProfileResponse = {
  user: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl?: string;
    primaryRoleLabel?: string;
    status: 'active' | 'invited' | 'suspended' | 'deactivated';
  };
  workspace: {
    companyId: string;
    companyName: string;
    siteId?: string;
    siteName?: string;
  };
  billing?: {
    visible: boolean;
    planName?: string;
    status?: string;
    trialDaysLeft?: number;
    canUpgrade: boolean;
  };
  menuSections: SidebarProfileMenuSection[];
};
