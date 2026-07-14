import { Injectable } from '@nestjs/common';

@Injectable()
export class PssrChecklistGeneratorService {
  preview(input: { pssrType?: string; startupType?: string; riskLevel?: string; equipmentCriticality?: string; moc?: any }) {
    const highRisk = ['High', 'Critical'].includes(input.riskLevel ?? input.moc?.risk_level);
    const safetySystem = /safety|sis|interlock|shutdown/i.test(`${input.pssrType ?? ''} ${input.moc?.change_type ?? ''} ${input.moc?.description ?? ''}`);
    const oshaCore = [
      'Construction and equipment are in accordance with design specifications.',
      'Safety procedures are in place and adequate.',
      'Operating procedures are in place and adequate.',
      'Maintenance procedures are in place and adequate.',
      'Emergency procedures are in place and adequate.',
      'For new facilities, Process Hazard Analysis has been performed.',
      'For new facilities, PHA recommendations have been resolved or implemented before startup.',
      'For modified facilities, Management of Change requirements have been completed.',
      'Training of each employee involved in operating the process has been completed.',
      'Process Safety Information has been updated and is available.'
    ].map((title) => ({
      title,
      groupName: 'OSHA 1910.119(i)(1) Core Requirements',
      required: true,
      requiredBeforeStartup: true,
      evidenceRequired: true,
      verificationRequired: true,
      ownerRole: 'HSE Manager',
      source: 'OSHA_1910_119_I_1_CORE',
      regulatorySource: 'OSHA',
      regulatoryReference: '1910.119(i)(1)',
      systemRequired: true,
      deletionLocked: true,
      bypassLocked: true,
      startupAuthorizationBlocking: true,
      certificateRequired: true,
      criticalityLevel: 'Critical',
      bypassAllowed: false,
      deferralAllowed: false,
      managementAcceptanceRequired: false
    }));
    const groups = [
      ['Process Safety Information', 'PSI updated and approved', true, true, true],
      ['Engineering / Construction Verification', 'Installation matches approved engineering package', true, true, true],
      ['Procedures', 'Operating, maintenance, and emergency procedures updated', true, true, false],
      ['Training', 'Affected personnel training completed and recorded', true, true, true],
      ['Safety Systems', safetySystem ? 'Safety instrumented functions tested and bypasses removed' : 'Safety systems reviewed for startup impact', true, safetySystem, true],
      ['Utilities / Energy Isolation', 'Utilities, isolation, and energization prerequisites verified', true, true, false],
      ['Environmental / Regulatory', 'Environmental and regulatory startup requirements satisfied', true, highRisk, false],
      ['Testing & Commissioning', 'Commissioning tests completed with acceptable results', true, true, true],
      ['Emergency Preparedness', 'Emergency response provisions confirmed before startup', true, highRisk, false],
      ['Startup Authorization', 'Final startup authorization signatures completed', true, true, true]
    ];
    const standard = groups.map(([groupName, title, requiredBeforeStartup, evidenceRequired, verificationRequired]) => ({
      title,
      groupName,
      required: true,
      requiredBeforeStartup,
      evidenceRequired,
      verificationRequired,
      ownerRole: groupName === 'Training' ? 'Operations Supervisor' : groupName === 'Safety Systems' ? 'HSE Manager' : 'Process Engineer',
      source: 'System Generated',
      criticalityLevel: requiredBeforeStartup ? 'High' : 'Standard',
      bypassAllowed: false,
      deferralAllowed: !requiredBeforeStartup,
      startupAuthorizationBlocking: requiredBeforeStartup,
      certificateRequired: requiredBeforeStartup
    }));
    return [...oshaCore, ...standard];
  }

  hazardItems(hazards: string[] = []) {
    const rules: Record<string, string[]> = {
      'Hydrogen service': ['Hydrogen leak test completed', 'Hydrogen detector coverage verified', 'Ventilation verified', 'Ignition source control verified', 'Materials compatibility confirmed', 'Purging/inerting procedure approved'],
      'HF acid service': ['HF-specific PPE and emergency response readiness verified', 'Calcium gluconate availability verified', 'HF detection/monitoring verified', 'Decontamination procedure ready', 'Emergency shower/eyewash verified', 'Specialized team briefing complete'],
      'Toxic gas service': ['Gas detection system tested', 'Respiratory protection readiness verified', 'Emergency response procedure reviewed', 'Shelter-in-place/alarm communication verified', 'Toxic release scenario communication complete'],
      'Cryogenic system': ['Low-temperature material compatibility verified', 'Cold box/insulation readiness verified', 'Oxygen deficiency hazard controls verified', 'Pressure relief devices verified', 'Cryogenic PPE readiness verified'],
      'Hazardous area classified zone': ['Electrical equipment certification verified', 'Ex-rated equipment inspection complete', 'Bonding/grounding verified', 'Hot work restrictions communicated', 'Area classification drawing current'],
      'High-pressure system': ['Pressure relief devices verified', 'Hydrotest/pneumatic test records verified', 'Pressure boundary inspection complete', 'Operating envelope communicated'],
      'SIS / ESD protected system': ['SIS functional test passed', 'ESD permissives verified', 'Bypasses removed or approved', 'Cause and effect verified'],
      'Fire and gas protected area': ['Fire and gas detector coverage verified', 'Alarm and executive action tested', 'Emergency response communication verified']
    };
    return [...new Set(hazards)].flatMap((hazard) => (rules[hazard] ?? []).map((title) => ({
      title,
      groupName: `Hazard-Specific Checks - ${hazard}`,
      required: true,
      requiredBeforeStartup: true,
      evidenceRequired: true,
      verificationRequired: true,
      ownerRole: 'HSE Manager',
      source: 'Hazard Checklist Rule',
      hazardType: hazard,
      systemRequired: true,
      deletionLocked: true,
      bypassLocked: true,
      startupAuthorizationBlocking: true,
      certificateRequired: true,
      criticalityLevel: 'High',
      bypassAllowed: false,
      deferralAllowed: false
    })));
  }
}
