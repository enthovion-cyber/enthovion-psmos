'use client';

import { Badge } from '../pssr-ui';

export function AutoVerificationStatusBadge({ status }: { status?: string }) {
  const tone = status === 'Passed' ? 'green' : status === 'Failed' ? 'red' : status === 'Pending' ? 'amber' : 'slate';
  return <Badge tone={tone}>{status ?? 'Pending'}</Badge>;
}
