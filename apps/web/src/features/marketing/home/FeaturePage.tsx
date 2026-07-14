import { AiIndustrialSection } from './AiIndustrialSection';
import { FeatureGridSection } from './FeatureGridSection';
import { ModulesSection } from './ModulesSection';
import { SecuritySection } from './SecuritySection';
import { WorkflowSection } from './WorkflowSection';

export function FeaturePage() {
  return (
    <main>
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-black uppercase tracking-[.18em] text-blue-500">Features</p>
          <h1 className="mt-3 max-w-4xl text-5xl font-black tracking-normal">Process safety workflows, platform controls, and audit-ready evidence in one workspace.</h1>
        </div>
      </section>
      <FeatureGridSection />
      <ModulesSection />
      <AiIndustrialSection />
      <WorkflowSection />
      <SecuritySection />
    </main>
  );
}
