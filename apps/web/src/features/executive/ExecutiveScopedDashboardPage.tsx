'use client';
import { ExecutiveDashboardPage } from './ExecutiveDashboardPage';
export function ExecutiveScopedDashboardPage({ scope }: { scope: Record<string, unknown> }) { return <ExecutiveDashboardPage scope={scope} />; }
