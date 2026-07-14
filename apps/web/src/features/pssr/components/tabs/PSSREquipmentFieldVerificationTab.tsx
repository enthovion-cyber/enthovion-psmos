'use client';

import { EmptyState, ErrorState, LoadingState, PSSRCard } from '../pssr-ui';
import { AffectedEquipmentVerificationTable } from '../field/AffectedEquipmentVerificationTable';
import { EquipmentWalkdownChecklist } from '../field/EquipmentWalkdownChecklist';
import { FieldBlockersPanel } from '../field/FieldBlockersPanel';
import { FieldEvidencePhotos } from '../field/FieldEvidencePhotos';
import { FieldVerificationSignoff } from '../field/FieldVerificationSignoff';
import { FieldVerificationSummaryCard } from '../field/FieldVerificationSummaryCard';
import { InstallationMatchesDesignSection } from '../field/InstallationMatchesDesignSection';
import { SafetyCriticalEquipmentVerification } from '../field/SafetyCriticalEquipmentVerification';
import { TagIdentificationVerification } from '../field/TagIdentificationVerification';
import { ValveLineupIsolationVerification } from '../field/ValveLineupIsolationVerification';
import { usePSSRFieldMutations } from '../../hooks/usePSSRFieldMutations';
import { usePSSRFieldVerification } from '../../hooks/usePSSRFieldVerification';

export function PSSREquipmentFieldVerificationTab({ pssr }: { pssr: any }) {
  const query = usePSSRFieldVerification(pssr.id);
  const mutations = usePSSRFieldMutations(pssr.id);
  const data = query.data;

  function fail(item: any) {
    const reason = window.prompt('Failure reason');
    if (reason) mutations.failEquipment.mutate({ verificationId: item.id, reason });
  }

  function photo(item?: any) {
    const fileName = window.prompt('Photo file name or storage reference');
    if (!fileName) return;
    const caption = window.prompt('Photo caption') ?? '';
    mutations.evidence.mutate({ equipmentVerificationId: item?.id, fileName, caption, evidenceType: 'Photo' });
  }

  function scan(item?: any) {
    const scannedValue = window.prompt('Scan or enter equipment tag / QR value');
    if (scannedValue) mutations.scanEquipment.mutate({ verificationId: item?.id, expectedEquipmentId: item?.equipment_id, scannedValue });
  }

  if (query.isLoading) return <LoadingState />;
  if (query.isError) return <ErrorState message="Unable to load field verification from API." />;
  if (!data?.equipment?.length) {
    return (
      <div className="space-y-4">
        <PSSRCard title="Equipment & Field Verification" action={<button onClick={() => mutations.generate.mutate()} className="rounded-md bg-blue-600 px-3 py-2 text-xs font-black text-white">Generate Field Verification</button>}>
          <EmptyState title="No affected equipment verification records generated yet." detail="Generate field verification records from affected equipment." />
        </PSSRCard>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <FieldVerificationSummaryCard summary={data.summary} />
      <PSSRCard title="Generate Field Records" action={<button onClick={() => mutations.generate.mutate()} className="rounded-md bg-blue-600 px-3 py-2 text-xs font-black text-white">Regenerate Missing Records</button>}>
        <p className="text-sm text-slate-400">Field verification records are generated from affected equipment and preserve completed records.</p>
      </PSSRCard>
      <AffectedEquipmentVerificationTable equipment={data.equipment ?? []} onVerify={(item) => mutations.verifyEquipment.mutate(item.id)} onFail={fail} onPhoto={photo} onScan={scan} />
      <div className="grid gap-4 xl:grid-cols-2">
        <EquipmentWalkdownChecklist checklist={data.checklist ?? []} onUpdate={(item, status) => mutations.updateChecklistItem.mutate({ itemId: item.id, values: { status } })} />
        <div className="space-y-4">
          <TagIdentificationVerification onScan={() => scan(data.equipment?.[0])} />
          <FieldEvidencePhotos evidence={data.evidence ?? []} onUpload={() => photo(data.equipment?.[0])} />
          <FieldVerificationSignoff signoffs={data.signoffs ?? []} />
        </div>
      </div>
      <InstallationMatchesDesignSection />
      <div className="grid gap-4 xl:grid-cols-2">
        <SafetyCriticalEquipmentVerification />
        <ValveLineupIsolationVerification />
      </div>
      <FieldBlockersPanel blockers={data.blockers ?? []} />
    </div>
  );
}
