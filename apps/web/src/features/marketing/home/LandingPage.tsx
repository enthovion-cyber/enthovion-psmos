import { AiIndustrialSection } from './AiIndustrialSection';
import { FeatureGridSection } from './FeatureGridSection';
import { FinalCtaSection } from './FinalCtaSection';
import { HeroSection } from './HeroSection';
import { ModulesSection } from './ModulesSection';
import { SecuritySection } from './SecuritySection';
import { TrustBar } from './TrustBar';
import { WorkflowSection } from './WorkflowSection';
import { PricingSection } from '../pricing/PricingSection';
import { FaqSection } from '../faq/FaqSection';

export function LandingPage() {
  return (
    <main>
      <HeroSection />
      <TrustBar />
      <FeatureGridSection />
      <ModulesSection />
      <WorkflowSection />
      <AiIndustrialSection />
      <SecuritySection />
      <PricingSection />
      <FaqSection />
      <FinalCtaSection />
    </main>
  );
}
