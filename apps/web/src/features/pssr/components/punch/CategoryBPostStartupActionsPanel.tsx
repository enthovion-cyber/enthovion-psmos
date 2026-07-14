'use client';
import { PunchCategoryPanel } from './PunchCategoryPanel';
export function CategoryBPostStartupActionsPanel({ items }: { items: any[] }) { return <PunchCategoryPanel title="Category B Post-Startup Actions" items={items.filter((item) => item.category === 'B' && !['Closed', 'Cancelled'].includes(item.status))} tone="amber" />; }
