'use client';
import { PunchCategoryPanel } from './PunchCategoryPanel';
export function CategoryAStartupBlockersPanel({ items }: { items: any[] }) { return <PunchCategoryPanel title="Category A Startup Blockers" items={items.filter((item) => item.category === 'A' && !['Closed', 'Cancelled'].includes(item.status))} tone="red" />; }
