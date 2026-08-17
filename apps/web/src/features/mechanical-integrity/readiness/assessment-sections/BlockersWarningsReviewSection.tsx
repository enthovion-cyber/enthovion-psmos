'use client';

import { SectionCard } from '../../safeguards/SafeguardUiPrimitives';
import { BlockerList } from '../BlockerList';
import type { MiReadinessBlocker } from '../../types/readiness.types';

export function BlockersWarningsReviewSection({ blockers }: { blockers?: MiReadinessBlocker[] }) {
  return (
    <SectionCard title="3. Blockers & Warnings Review" description="Review open blockers, startup blockers, waiver state, owner, due date, and recommended action before proposing a final decision.">
      <BlockerList blockers={blockers ?? []} />
    </SectionCard>
  );
}
