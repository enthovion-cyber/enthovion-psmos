import { CheckCircle2 } from 'lucide-react';

export function PricingFeatureList({ features }: { features: string[] }) {
  return (
    <ul className="mt-5 space-y-3">
      {features.map((feature) => (
        <li key={feature} className="flex items-start gap-2 text-sm text-[var(--psm-muted)]">
          <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-500" />
          <span>{feature}</span>
        </li>
      ))}
    </ul>
  );
}
