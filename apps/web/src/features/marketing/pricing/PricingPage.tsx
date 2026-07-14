import { FaqSection } from '../faq/FaqSection';
import { PricingSection } from './PricingSection';

export function PricingPage() {
  return (
    <main>
      <PricingSection showComparison />
      <FaqSection />
    </main>
  );
}
