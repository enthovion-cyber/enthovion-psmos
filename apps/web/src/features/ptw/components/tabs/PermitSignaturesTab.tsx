import { SignatureMatrix } from '@/features/signatures/components/SignatureMatrix';
import { SignatureHistoryTable } from '../signatures/SignatureHistoryTable';
import { usePermitSignatureHistory } from '../../hooks/usePermitSignatures';

export function PermitSignaturesTab({ permit }: { permit: any }) {
  const history = usePermitSignatureHistory(permit.id);

  return (
    <div className="w-full space-y-4 p-1 sm:p-0">
      <SignatureMatrix
        title="Universal PTW E-Signature Matrix"
        context={{
          moduleName: 'PTW',
          recordType: 'permit',
          recordId: permit.id,
          recordNumber: permit.permit_number ?? permit.permitNumber,
          actionType: permit.status === 'Closed' ? 'close' : 'issue'
        }}
      />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_minmax(300px,360px)] items-start">
        <div className="space-y-4 min-w-0 w-full">
          <section className="psm-card p-4 sm:p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide">Signature Enforcement</h3>
            <p className="mt-2 text-sm text-[var(--psm-muted)]">
              PTW signing is controlled by the Universal E-Signature Engine. Legacy permit-specific signature rows are retained as read-only history only.
            </p>
          </section>
          <div className="overflow-x-auto min-w-0">
            <SignatureHistoryTable rows={history.data} />
          </div>
        </div>
        <aside className="space-y-4 w-full min-w-0">
          <section className="psm-card p-4 sm:p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide">Lifecycle Rules</h3>
            <div className="mt-4 space-y-3 text-sm">
              <Rule label="Issue" value="Issue signatures must be complete before permit issue." />
              <Rule label="Activation" value="Activation signatures block active work until signed." />
              <Rule label="Extension" value="Extension can require revalidation when scope or duration changes." />
              <Rule label="Closure" value="Closure Authority and holder closure signatures protect closeout." />
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Rule({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 break-words">
      <div className="font-semibold">{label}</div>
      <p className="mt-1 text-xs text-[var(--psm-muted)]">{value}</p>
    </div>
  );
}
