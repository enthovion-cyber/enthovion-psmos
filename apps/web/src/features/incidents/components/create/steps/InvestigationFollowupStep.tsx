'use client';
import { Card, Select } from '../FormBits';
import { FollowupRecommendationPanel } from '../FollowupRecommendationPanel';
export function InvestigationFollowupStep({ values, update, context, followups }: any) {
  return <Card title="11. Investigation Priority & Required Follow-up"><FollowupRecommendationPanel data={followups} /><div className="mt-3 grid gap-3 md:grid-cols-2"><Select label="Suggested investigation owner" value={values.investigationOwnerId} onChange={(v) => update({ investigationOwnerId: v })} options={context?.users ?? []} /><Select label="Override priority if allowed" value={values.investigationPriority} onChange={(v) => update({ investigationPriority: v })} options={context?.priorities ?? []} /></div></Card>;
}
