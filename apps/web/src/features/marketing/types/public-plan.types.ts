export type PublicPlan = {
  code: 'trial' | 'starter' | 'pro' | 'enterprise' | string;
  name: string;
  description?: string | null;
  features: string[];
  limits?: Record<string, unknown>;
  priceDisplay?: string | null;
  trialDays?: number | null;
  ctaType: 'trial' | 'checkout' | 'contact_sales' | string;
  highlighted?: boolean;
  sortOrder?: number;
};

export type PublicMarketingConfig = {
  productName: string;
  trialDays: number;
  trialRequiresCard: boolean;
  paidCheckoutProvider: string;
  cardCollectionInApp: boolean;
  contactSalesPath: string;
};
