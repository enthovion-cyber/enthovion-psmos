import { Sigma } from 'lucide-react';
import { FieldGrid, LopaPanel, TonePill } from './LopaOverviewShared';

export function LopaSilRequirementSnapshot({ sil }: { sil: Record<string, any> }) {
  return (
    <LopaPanel title="SIL Requirement Snapshot" action={<TonePill tone={sil.sifRequired ? 'danger' : 'success'}><Sigma size={12} /> {sil.sifRequired ? 'SIF Required' : 'No SIF Required'}</TonePill>}>
      <FieldGrid items={[
        ['SIL evaluation status', sil.status],
        ['Required SIL', sil.requiredSil],
        ['Installed SIL', sil.installedSil],
        ['SIL gap status', sil.silGapStatus],
        ['Required PFDavg', sil.requiredPfdavg],
        ['Required RRF', sil.requiredRrf],
        ['ALARP category', sil.alarpCategory],
        ['Existing SIF linked', sil.existingSifLinked ? 'Yes' : 'No'],
        ['New SIF required', sil.newSifRequired ? 'Yes' : 'No'],
        ['MOC required', sil.mocRequired ? 'Yes' : 'No'],
        ['MI proof test required', sil.miProofTestRequired ? 'Yes' : 'No'],
        ['Determination status', sil.determinationStatus]
      ]} />
    </LopaPanel>
  );
}
