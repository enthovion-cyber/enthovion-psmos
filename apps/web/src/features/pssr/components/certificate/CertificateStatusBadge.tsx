'use client';

import { Badge } from '../pssr-ui';

export function CertificateStatusBadge({ status }: { status?: string }) {
  const tone = status === 'Issued' ? 'green' : status === 'Superseded' ? 'amber' : status === 'Revoked' || status === 'Missing' ? 'red' : 'slate';
  return <Badge tone={tone}>{status ?? 'Missing'}</Badge>;
}
