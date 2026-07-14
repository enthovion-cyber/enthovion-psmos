export class SignatureLifecycleBlocker {
  static blockers(rows: Array<Record<string, any>>) {
    const required = rows.filter((row) => row.status !== 'Skipped by Rule' && row.status !== 'Not Required');
    const pending = required.filter((row) => ['Pending', 'Revalidation Required', 'Expired'].includes(row.status));
    const rejected = required.filter((row) => row.status === 'Rejected');
    return [
      pending.length ? `${pending.length} required signature(s) pending` : null,
      rejected.length ? `${rejected.length} signature(s) rejected` : null,
      rows.some((row) => row.status === 'Expired' || row.revalidation_required) ? 'Signature revalidation required' : null,
      required.some((row) => !row.assigned_user_id && !row.assigned_role_id) ? 'Required role has no assigned user or role' : null
    ].filter((item): item is string => Boolean(item));
  }
}
