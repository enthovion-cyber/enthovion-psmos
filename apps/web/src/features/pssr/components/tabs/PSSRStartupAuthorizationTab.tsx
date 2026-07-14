'use client';

import { usePSSRAuthorizationMutations } from '../../hooks/usePSSRAuthorizationMutations';
import { usePSSRStartupAuthorization } from '../../hooks/usePSSRStartupAuthorization';
import { AuthorizationHistory } from '../authorization/AuthorizationHistory';
import { AuthorizationSignatureMatrix } from '../authorization/AuthorizationSignatureMatrix';
import { FinalReadinessChecklist } from '../authorization/FinalReadinessChecklist';
import { StartupAuthorizationSummaryCard } from '../authorization/StartupAuthorizationSummaryCard';
import { StartupBlockersPanel } from '../authorization/StartupBlockersPanel';
import { StartupConditionsPanel } from '../authorization/StartupConditionsPanel';
import { StartupReleaseCertificatePanel } from '../authorization/StartupReleaseCertificatePanel';
import { StartupReleaseDecisionPanel } from '../authorization/StartupReleaseDecisionPanel';
import { ErrorState, LoadingState } from '../pssr-ui';
import { usePSSRAutoVerification, usePSSRCertificate, usePSSRDisciplineSignoffs, usePSSRPhase1Mutations, usePSSRSecureShares } from '../../hooks/usePSSRPhase1';
import { AutoVerificationLinksPanel } from '../auto-verification/AutoVerificationLinksPanel';
import { DisciplineSignoffMatrix } from '../authorization/DisciplineSignoffMatrix';
import { StartupCertificatePanel } from '../certificate/StartupCertificatePanel';
import { SecureInspectorSharePanel } from '../certificate/SecureInspectorSharePanel';
import { SignatureMatrix } from '@/features/signatures/components/SignatureMatrix';

export function PSSRStartupAuthorizationTab({ pssr }: { pssr: any }) {
  const query = usePSSRStartupAuthorization(pssr.id);
  const mutations = usePSSRAuthorizationMutations(pssr.id);
  const phase1 = usePSSRPhase1Mutations(pssr.id);
  const autoVerification = usePSSRAutoVerification(pssr.id);
  const discipline = usePSSRDisciplineSignoffs(pssr.id);
  const certificate = usePSSRCertificate(pssr.id);
  const shares = usePSSRSecureShares(pssr.id);
  if (query.isLoading) return <LoadingState />;
  if (query.isError) return <ErrorState message="Unable to load startup authorization from API." />;
  const data = query.data ?? {};
  return (
    <div className="space-y-4">
      <StartupReleaseDecisionPanel onReadiness={() => mutations.readinessCheck.mutate()} onMarkReady={() => mutations.markReady.mutate()} onAuthorize={() => mutations.authorize.mutate()} onRelease={() => mutations.release.mutate()} onReturn={() => mutations.returnForCorrection.mutate('Returned for correction from authorization tab')} onCancel={() => mutations.cancel.mutate('Cancelled from authorization tab')} />
      <StartupAuthorizationSummaryCard summary={data.summary} />
      <FinalReadinessChecklist checklist={data.checklist ?? []} />
      <div className="grid gap-4 xl:grid-cols-2">
        <AutoVerificationLinksPanel links={autoVerification.data ?? []} onSync={() => phase1.syncAutoVerifications.mutate()} busy={phase1.syncAutoVerifications.isPending} />
        <StartupCertificatePanel certificate={certificate.data} pssr={pssr} onGenerate={() => phase1.generateCertificate.mutate()} onShare={() => phase1.createSecureShare.mutate({ accessScope: 'certificate_only', expiresAt: new Date(Date.now() + 14 * 86400000).toISOString() })} busy={phase1.generateCertificate.isPending} />
      </div>
      <DisciplineSignoffMatrix data={discipline.data} onGenerate={() => phase1.generateDisciplineSignoffs.mutate()} busy={phase1.generateDisciplineSignoffs.isPending} />
      <SignatureMatrix
        title="Universal PSSR Discipline Sign-Off Signatures"
        context={{
          moduleName: 'PSSR',
          recordType: 'discipline_signoff',
          recordId: pssr.id,
          recordNumber: pssr.pssr_number ?? pssr.pssrNumber,
          actionType: 'sign'
        }}
      />
      <SignatureMatrix
        title="Universal PSSR Startup Authorization Signatures"
        context={{
          moduleName: 'PSSR',
          recordType: 'startup_authorization',
          recordId: pssr.id,
          recordNumber: pssr.pssr_number ?? pssr.pssrNumber,
          actionType: 'authorize'
        }}
      />
      <div className="grid gap-4 xl:grid-cols-[1.3fr_.9fr]">
        <StartupBlockersPanel blockers={data.blockers ?? []} />
        <StartupReleaseCertificatePanel certificate={data.certificate} />
      </div>
      <SecureInspectorSharePanel shares={shares.data ?? []} onCreate={() => phase1.createSecureShare.mutate({ accessScope: 'certificate_only', expiresAt: new Date(Date.now() + 14 * 86400000).toISOString() })} onRevoke={(id) => phase1.revokeSecureShare.mutate(id)} busy={phase1.createSecureShare.isPending} />
      <AuthorizationSignatureMatrix signatures={data.signatures ?? []} onGenerate={() => mutations.generateSignatures.mutate()} />
      <div className="grid gap-4 xl:grid-cols-2">
        <StartupConditionsPanel conditions={data.conditions ?? []} onAdd={() => mutations.addCondition.mutate({ conditionType: 'Startup Condition', description: 'Control room to monitor startup conditions and temporary controls.', required: true })} />
        <AuthorizationHistory history={data.history ?? []} />
      </div>
    </div>
  );
}
