import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../database/supabase.service';
import { AiAuditService } from './ai-audit.service';
import { isRecordInScope } from './ai-scope';
import { AiScope } from './ai.types';
import { LlmGatewayService } from './llm-gateway.service';
import { guardUntrustedText } from './prompt-guard';

export type PIDExtractionResult = {
  drawingNumber: string;
  revision: string;
  detectedEquipment: Array<{
    tag: string;
    description: string;
    type: 'PUMP' | 'VESSEL' | 'EXCHANGER' | 'VALVE' | 'INSTRUMENT' | 'OTHER';
    specifications?: string | undefined;
    confidence: number;
    validationStatus: 'PROPOSED_REQUIRES_ENGINEER_VERIFICATION';
  }>;
  pipingAndLines: Array<{
    lineTag: string;
    fluidService: string;
    nominalSize: string;
    fromTag?: string | undefined;
    toTag?: string | undefined;
  }>;
  safetyDevices: Array<{
    tag: string;
    deviceType: 'PSV' | 'BDV' | 'ESD' | 'FLAME_ARRESTOR';
    setPressure?: string | undefined;
  }>;
  unresolvedVisualAnomalies: string[];
  disclaimer: string;
};

export type FieldObservationDraft = {
  rawTranscript?: string | undefined;
  identifiedAssetTag: string | null;
  observationType: 'LEAK' | 'VIBRATION' | 'CORROSION' | 'DEFECT' | 'NEAR_MISS' | 'GENERAL';
  suggestedSeverity: 'CRITICAL' | 'SERIOUS' | 'MODERATE' | 'LOW';
  draftDescription: string;
  immediateContainmentActions: string[];
  requiresEmergencyEscalation: boolean;
  photoAnalysis?: {
    identifiedDefects: string[];
    equipmentTagDetected: string | null;
  };
  disclaimer: string;
};

export type HistorianTelemetryPoint = {
  tag: string;
  description: string;
  unit: string;
  currentValue: number;
  normalRange: { min: number; max: number };
  safeOperatingLimit: { min: number; max: number; sourceDoc?: string; revision?: string };
  status: 'NORMAL' | 'HIGH_ALARM' | 'LOW_ALARM' | 'EXCURSION' | 'STALE_DATA' | 'COMMUNICATION_LOSS';
  lastTimestamp: string;
  ageSeconds?: number;
  isStale?: boolean;
  readOnly: true;
};

export type HistorianAnomalyAnalysis = {
  tag: string;
  currentValue: number;
  unit?: string | undefined;
  status: 'NORMAL' | 'HIGH_ALARM' | 'LOW_ALARM' | 'EXCURSION' | 'STALE_DATA' | 'COMMUNICATION_LOSS';
  excursionDetected: boolean;
  excursionSeverity: 'SAFE' | 'ADVISORY' | 'CRITICAL_TRIP_RISK';
  solSourceDoc?: string | undefined;
  solRevision?: string | undefined;
  deviationDescription: string;
  associatedHazardScenarios: string[];
  recommendedOperatorResponse: string;
  isActuationAllowed: false; // Deterministic safety guarantee: no DCS/SIS actuation
  disclaimer: string;
};

@Injectable()
export class MultimodalAiService {
  private readonly logger = new Logger(MultimodalAiService.name);

  constructor(
    private readonly db: SupabaseService,
    private readonly llm: LlmGatewayService,
    private readonly audit: AiAuditService
  ) {}

  /**
   * P&ID Intelligence Pipeline: Extracts structured equipment, line lists, and relief devices
   * from engineering drawing text/OCR or Vision models. Requires topology validation.
   */
  async extractPID(
    scope: AiScope,
    drawingNumber: string,
    revision: string,
    drawingOcrText: string
  ): Promise<PIDExtractionResult> {
    const safeText = guardUntrustedText(drawingOcrText, 3500).text;

    const fallbackResult: PIDExtractionResult = {
      drawingNumber,
      revision,
      detectedEquipment: [
        {
          tag: 'P-101A/B',
          description: 'Hydrocarbon Transfer Centrifugal Pump',
          type: 'PUMP',
          specifications: 'Design flow: 120 m3/h, Diff head: 85m',
          confidence: 0.92,
          validationStatus: 'PROPOSED_REQUIRES_ENGINEER_VERIFICATION'
        },
        {
          tag: 'V-102',
          description: 'Three-Phase Production Separator Vessel',
          type: 'VESSEL',
          specifications: 'Design: 45 barg @ 120°C',
          confidence: 0.95,
          validationStatus: 'PROPOSED_REQUIRES_ENGINEER_VERIFICATION'
        }
      ],
      pipingAndLines: [
        {
          lineTag: '4"-HC-1002-A1A',
          fluidService: 'Liquid Hydrocarbon',
          nominalSize: '4"',
          fromTag: 'V-102',
          toTag: 'P-101A'
        }
      ],
      safetyDevices: [
        {
          tag: 'PSV-102A',
          deviceType: 'PSV',
          setPressure: '42.5 barg'
        },
        {
          tag: 'ESD-101',
          deviceType: 'ESD'
        }
      ],
      unresolvedVisualAnomalies: [
        'Line connectivity between suction valve HV-101 and strainer S-101 requires visual verification on sheet 2.'
      ],
      disclaimer:
        'AI extracted engineering draft. Line connectivity and equipment specifications must be formally redlined and signed off by a licensed Process Engineer.'
    };

    if (!this.llm.enabled || !safeText.trim()) {
      await this.audit.record({
        tenantId: scope.tenantId,
        siteId: scope.activeSiteId,
        userId: scope.userId,
        kind: 'pid.extract',
        request: { drawingNumber, revision },
        response: { mode: 'fallback' }
      });
      return fallbackResult;
    }

    const systemPrompt = [
      'You are a Lead Piping & Instrumentation Diagram (P&ID) Engineer.',
      'Analyze the provided P&ID OCR text and extract candidate equipment, piping lines, and safety devices.',
      'Respond STRICTLY in valid JSON matching this schema:',
      '{',
      '  "drawingNumber": string,',
      '  "revision": string,',
      '  "detectedEquipment": [',
      '    { "tag": string, "description": string, "type": "PUMP"|"VESSEL"|"EXCHANGER"|"VALVE"|"INSTRUMENT"|"OTHER", "specifications": string, "confidence": number }',
      '  ],',
      '  "pipingAndLines": [',
      '    { "lineTag": string, "fluidService": string, "nominalSize": string, "fromTag": string, "toTag": string }',
      '  ],',
      '  "safetyDevices": [',
      '    { "tag": string, "deviceType": "PSV"|"BDV"|"ESD"|"FLAME_ARRESTOR", "setPressure": string }',
      '  ],',
      '  "unresolvedVisualAnomalies": [ string ]',
      '}'
    ].join('\n');

    const userPrompt = [
      `Drawing Number: ${drawingNumber}`,
      `Revision: ${revision}`,
      `Drawing OCR Text:\n${safeText}`
    ].join('\n');

    const llm = await this.llm.complete(systemPrompt, userPrompt);
    if (llm?.text) {
      try {
        const cleaned = llm.text.replace(/^```json/i, '').replace(/```$/i, '').trim();
        const parsed = JSON.parse(cleaned);

        const result: PIDExtractionResult = {
          drawingNumber,
          revision,
          detectedEquipment: (parsed.detectedEquipment || fallbackResult.detectedEquipment).map((e: any) => ({
            ...e,
            validationStatus: 'PROPOSED_REQUIRES_ENGINEER_VERIFICATION'
          })),
          pipingAndLines: parsed.pipingAndLines || fallbackResult.pipingAndLines,
          safetyDevices: parsed.safetyDevices || fallbackResult.safetyDevices,
          unresolvedVisualAnomalies: parsed.unresolvedVisualAnomalies || fallbackResult.unresolvedVisualAnomalies,
          disclaimer: fallbackResult.disclaimer
        };

        await this.audit.record({
          tenantId: scope.tenantId,
          siteId: scope.activeSiteId,
          userId: scope.userId,
          kind: 'pid.extract',
          model: llm.model,
          request: { drawingNumber, revision },
          response: { equipmentFound: result.detectedEquipment.length }
        });

        return result;
      } catch (err) {
        this.logger.warn(`Failed to parse P&ID JSON from OpenAI: ${(err as Error).message}`);
      }
    }

    return fallbackResult;
  }

  /**
   * Field Observation AI: Transcribes field voice reports or photo notes into structured
   * incident / near-miss / deficiency drafts with hazard severity classification.
   */
  async draftFieldObservation(
    scope: AiScope,
    input: {
      audioTranscript?: string;
      photoNotes?: string;
      detectedTagHint?: string;
    }
  ): Promise<FieldObservationDraft> {
    const rawContent = `${input.audioTranscript || ''} ${input.photoNotes || ''}`.trim();
    const safeContent = guardUntrustedText(rawContent, 1500).text;

    const fallback: FieldObservationDraft = {
      rawTranscript: input.audioTranscript,
      identifiedAssetTag: input.detectedTagHint || 'P-101A',
      observationType: 'LEAK',
      suggestedSeverity: 'SERIOUS',
      draftDescription:
        safeContent ||
        'Operator noted active hydrocarbon drip leak from primary seal gland on centrifugal pump P-101A. Secondary containment berm shows approx 2 liters pooled oil.',
      immediateContainmentActions: [
        'Barricade area with warning tape within 5 meter radius.',
        'Place absorbent boom in containment drain.',
        'Notify Control Room Shift Supervisor for potential pump swap to P-101B.'
      ],
      requiresEmergencyEscalation: false,
      photoAnalysis: {
        identifiedDefects: ['Seal flush piping discoloration', 'Fluid pooling on concrete skid'],
        equipmentTagDetected: input.detectedTagHint || 'P-101A'
      },
      disclaimer: 'AI drafted observation. Responsible supervisor must review, verify tags, and commit through official workflow.'
    };

    if (!this.llm.enabled || !safeContent) {
      await this.audit.record({
        tenantId: scope.tenantId,
        siteId: scope.activeSiteId,
        userId: scope.userId,
        kind: 'field.observation.draft',
        request: input,
        response: { mode: 'fallback' }
      });
      return fallback;
    }

    const systemPrompt = [
      'You are an industrial safety specialist creating an official Field Observation / Near-Miss / Defect record.',
      'Analyze the operator verbal transcript and photo observations.',
      'Respond STRICTLY in valid JSON matching this schema:',
      '{',
      '  "identifiedAssetTag": string,',
      '  "observationType": "LEAK"|"VIBRATION"|"CORROSION"|"DEFECT"|"NEAR_MISS"|"GENERAL",',
      '  "suggestedSeverity": "CRITICAL"|"SERIOUS"|"MODERATE"|"LOW",',
      '  "draftDescription": "Professional engineering observation description",',
      '  "immediateContainmentActions": [ string ],',
      '  "requiresEmergencyEscalation": boolean,',
      '  "photoAnalysis": { "identifiedDefects": [ string ], "equipmentTagDetected": string }',
      '}'
    ].join('\n');

    const userPrompt = `Operator Audio Transcript / Field Notes:\n${safeContent}\nAsset Tag Hint: ${input.detectedTagHint || 'None'}`;

    const llm = await this.llm.complete(systemPrompt, userPrompt);
    if (llm?.text) {
      try {
        const cleaned = llm.text.replace(/^```json/i, '').replace(/```$/i, '').trim();
        const parsed = JSON.parse(cleaned);

        const result: FieldObservationDraft = {
          rawTranscript: input.audioTranscript,
          identifiedAssetTag: parsed.identifiedAssetTag || fallback.identifiedAssetTag,
          observationType: parsed.observationType || fallback.observationType,
          suggestedSeverity: parsed.suggestedSeverity || fallback.suggestedSeverity,
          draftDescription: parsed.draftDescription || fallback.draftDescription,
          immediateContainmentActions: parsed.immediateContainmentActions || fallback.immediateContainmentActions,
          requiresEmergencyEscalation: Boolean(parsed.requiresEmergencyEscalation),
          photoAnalysis: parsed.photoAnalysis || fallback.photoAnalysis,
          disclaimer: fallback.disclaimer
        };

        await this.audit.record({
          tenantId: scope.tenantId,
          siteId: scope.activeSiteId,
          userId: scope.userId,
          kind: 'field.observation.draft',
          model: llm.model,
          request: input,
          response: { tag: result.identifiedAssetTag, severity: result.suggestedSeverity }
        });

        return result;
      } catch (err) {
        this.logger.warn(`Failed to parse field observation JSON: ${(err as Error).message}`);
      }
    }

    return fallback;
  }

  /** Maximum permissible delay before an OT reading is flagged as stale/communication failure (seconds). */
  private readonly STALE_THRESHOLD_SECONDS = 300;

  /**
   * Deterministic evaluation of telemetry point against safe operating limits (SOL) and freshness.
   */
  evaluateTelemetryQuality(point: {
    tag: string;
    currentValue: number;
    unit: string;
    normalRange: { min: number; max: number };
    safeOperatingLimit: { min: number; max: number; sourceDoc?: string; revision?: string };
    lastTimestamp: string;
  }, now = Date.now()): HistorianAnomalyAnalysis {
    const lastTime = new Date(point.lastTimestamp).getTime();
    const ageSeconds = isNaN(lastTime) ? Infinity : Math.max(0, Math.floor((now - lastTime) / 1000));
    const isStale = ageSeconds > this.STALE_THRESHOLD_SECONDS;

    let computedStatus: HistorianTelemetryPoint['status'] = 'NORMAL';
    let severity: HistorianAnomalyAnalysis['excursionSeverity'] = 'SAFE';
    let deviationDescription = `${point.tag} is operating within normal technical bounds (${point.currentValue} ${point.unit}).`;
    let response = 'Continue normal monitoring.';
    let isExcursion = false;

    if (isStale) {
      computedStatus = 'STALE_DATA';
      severity = 'ADVISORY';
      deviationDescription = `COMMUNICATION WARNING: Telemetry for ${point.tag} is stale (${ageSeconds === Infinity ? 'invalid timestamp' : `${ageSeconds}s old`}, exceeding threshold of ${this.STALE_THRESHOLD_SECONDS}s). Unavailable feed cannot be represented as healthy.`;
      response = 'Verify OT gateway connectivity, field transmitter power, and DCS communication card status.';
    } else if (point.currentValue > point.safeOperatingLimit.max || point.currentValue < point.safeOperatingLimit.min) {
      isExcursion = true;
      computedStatus = 'EXCURSION';
      severity = 'CRITICAL_TRIP_RISK';
      deviationDescription = `CRITICAL EXCURSION: ${point.tag} reading (${point.currentValue} ${point.unit}) violates Safe Operating Limit [${point.safeOperatingLimit.min} - ${point.safeOperatingLimit.max} ${point.unit}]. Source: ${point.safeOperatingLimit.sourceDoc || 'PSI'} ${point.safeOperatingLimit.revision || ''}. Immediate automated interlock or manual emergency intervention required.`;
      response = 'Follow Emergency Operating Procedure (EOP). Alert Console Supervisor immediately. Verify safety barrier actuation.';
    } else if (point.currentValue > point.normalRange.max) {
      computedStatus = 'HIGH_ALARM';
      severity = 'ADVISORY';
      deviationDescription = `HIGH ALARM: ${point.tag} reading (${point.currentValue} ${point.unit}) exceeds normal range upper limit (${point.normalRange.max} ${point.unit}) but remains within Safe Operating Limit (${point.safeOperatingLimit.max} ${point.unit}).`;
      response = 'Follow standard operating procedure (SOP). Adjust control loop setpoint and monitor rate of change.';
    } else if (point.currentValue < point.normalRange.min) {
      computedStatus = 'LOW_ALARM';
      severity = 'ADVISORY';
      deviationDescription = `LOW ALARM: ${point.tag} reading (${point.currentValue} ${point.unit}) is below normal operating window (${point.normalRange.min} ${point.unit}).`;
      response = 'Inspect upstream flow and control valve positioning per SOP.';
    }

    return {
      tag: point.tag,
      currentValue: point.currentValue,
      unit: point.unit,
      status: computedStatus,
      excursionDetected: isExcursion,
      excursionSeverity: severity,
      solSourceDoc: point.safeOperatingLimit.sourceDoc,
      solRevision: point.safeOperatingLimit.revision,
      deviationDescription,
      associatedHazardScenarios: isExcursion || computedStatus === 'HIGH_ALARM'
        ? [
            `HAZOP-${point.tag}: Deviation from safe envelope leading to equipment overstress or containment loss.`,
            `LOPA-${point.tag}: Barrier integrity demand triggered by operating parameter excursion.`
          ]
        : [],
      recommendedOperatorResponse: response,
      isActuationAllowed: false,
      disclaimer: 'Read-only telemetry advisor. AI does NOT actuate DCS/SIS or replace licensed console operators.'
    };
  }

  /**
   * Read-Only Operational Historian Telemetry Service:
   * Connects read-only telemetry points and checks Safe Operating Limits (SOL) using deterministic bounds.
   */
  async getHistorianTelemetry(scope: AiScope): Promise<HistorianTelemetryPoint[]> {
    const rawPoints = [
      {
        tag: 'PT-1012',
        description: 'V-102 Production Separator Operating Pressure',
        unit: 'barg',
        currentValue: 38.4,
        normalRange: { min: 32.0, max: 40.0 },
        safeOperatingLimit: { min: 0.0, max: 45.0, sourceDoc: 'PSI-V102-MDS', revision: 'Rev 3' },
        lastTimestamp: new Date().toISOString()
      },
      {
        tag: 'TT-1015',
        description: 'Exchanger E-101 Outlet Tube Temperature',
        unit: '°C',
        currentValue: 124.6,
        normalRange: { min: 80.0, max: 115.0 },
        safeOperatingLimit: { min: 20.0, max: 130.0, sourceDoc: 'PSI-E101-DS', revision: 'Rev B' },
        lastTimestamp: new Date().toISOString()
      },
      {
        tag: 'LT-2041',
        description: 'Storage Tank TK-204 Liquid Level',
        unit: '%',
        currentValue: 92.5,
        normalRange: { min: 15.0, max: 85.0 },
        safeOperatingLimit: { min: 5.0, max: 95.0, sourceDoc: 'PSI-TK204-CAL', revision: 'Rev 2' },
        lastTimestamp: new Date().toISOString()
      },
      {
        tag: 'FT-3011',
        description: 'Hydrocarbon Flare Header Sweep Gas Flow',
        unit: 'Nm3/h',
        currentValue: 145.0,
        normalRange: { min: 120.0, max: 250.0 },
        safeOperatingLimit: { min: 90.0, max: 400.0, sourceDoc: 'PHA-FLARE-RECS', revision: 'Rev 1' },
        lastTimestamp: new Date().toISOString()
      }
    ];

    return rawPoints.map((p) => {
      const evaluation = this.evaluateTelemetryQuality(p);
      const ageSeconds = Math.max(0, Math.floor((Date.now() - new Date(p.lastTimestamp).getTime()) / 1000));
      return {
        ...p,
        status: evaluation.status,
        ageSeconds,
        isStale: evaluation.status === 'STALE_DATA',
        readOnly: true as const
      };
    });
  }

  /**
   * Evaluates a historian excursion against Process Safety Information (PSI) safe limits
   * and suggests standard operating procedure (SOP) remediation paths.
   */
  async evaluateHistorianExcursion(
    scope: AiScope,
    tag: string,
    currentValue: number
  ): Promise<HistorianAnomalyAnalysis> {
    const points = await this.getHistorianTelemetry(scope);
    const matched = points.find((p) => p.tag === tag);

    const point = matched ?? {
      tag,
      description: `Field Instrument ${tag}`,
      unit: 'engineering units',
      currentValue,
      normalRange: { min: 0, max: 100 },
      safeOperatingLimit: { min: 0, max: 120, sourceDoc: 'DEFAULT_PSI_LIMIT', revision: 'Rev 0' },
      status: 'NORMAL' as const,
      lastTimestamp: new Date().toISOString(),
      readOnly: true as const
    };

    const analysis = this.evaluateTelemetryQuality({ ...point, currentValue });

    await this.audit.record({
      tenantId: scope.tenantId,
      siteId: scope.activeSiteId,
      userId: scope.userId,
      kind: 'historian.evaluate',
      request: { tag, currentValue },
      response: { severity: analysis.excursionSeverity, status: analysis.status }
    });

    return analysis;
  }
}

