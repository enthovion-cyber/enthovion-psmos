'use client';
import { PunchCategoryPanel } from './PunchCategoryPanel';
export function CategoryCMinorItemsPanel({ items }: { items: any[] }) { return <PunchCategoryPanel title="Category C Minor Items" items={items.filter((item) => item.category === 'C' && !['Closed', 'Cancelled'].includes(item.status))} tone="blue" />; }
