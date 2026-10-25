-- Migration: 20260804100000_csm_phase2_prequalification.sql
-- Module: Contractor Safety Management (OSHA 29 CFR 1910.119(h)) - Phase 2: Prequalification Scoring Engine & Gradebook

-- 1. Contractor Historical Annual Safety Metrics (3-Year Rolling Records)
CREATE TABLE IF NOT EXISTS public.csm_contractor_metrics (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id TEXT NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  contractor_id TEXT NOT NULL REFERENCES public.csm_contractor_profiles(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  total_hours_worked BIGINT NOT NULL DEFAULT 0,
  fatalities_count INTEGER NOT NULL DEFAULT 0,
  recordable_cases_count INTEGER NOT NULL DEFAULT 0,
  dart_cases_count INTEGER NOT NULL DEFAULT 0,
  trir NUMERIC(6,3) DEFAULT 0.000, -- (recordable_cases_count * 200000) / total_hours_worked
  dart_rate NUMERIC(6,3) DEFAULT 0.000, -- (dart_cases_count * 200000) / total_hours_worked
  emr NUMERIC(5,3) DEFAULT 1.000, -- Experience Modification Rate
  emr_carrier TEXT,
  osha_citations_count INTEGER NOT NULL DEFAULT 0,
  osha_citations_penalties_usd NUMERIC(12,2) DEFAULT 0.00,
  has_written_safety_program BOOLEAN NOT NULL DEFAULT TRUE,
  has_subcontractor_management_plan BOOLEAN NOT NULL DEFAULT TRUE,
  verification_doc_id TEXT REFERENCES public.csm_contractor_documents(id) ON DELETE SET NULL,
  recorded_by_user_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(contractor_id, year)
);

CREATE INDEX IF NOT EXISTS idx_csm_metrics_lookup ON public.csm_contractor_metrics(contractor_id, year);

-- 2. Formal Prequalification Evaluation Log
CREATE TABLE IF NOT EXISTS public.csm_prequal_evaluations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id TEXT NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  contractor_id TEXT NOT NULL REFERENCES public.csm_contractor_profiles(id) ON DELETE CASCADE,
  evaluation_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  evaluator_user_id TEXT,
  overall_score NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  safety_grade TEXT NOT NULL DEFAULT 'UNRATED', -- 'A', 'B', 'C', 'D', 'F'
  three_year_avg_trir NUMERIC(6,3) DEFAULT 0.000,
  three_year_avg_dart NUMERIC(6,3) DEFAULT 0.000,
  current_emr NUMERIC(5,3) DEFAULT 1.000,
  fatalities_in_three_years INTEGER NOT NULL DEFAULT 0,
  citations_in_three_years INTEGER NOT NULL DEFAULT 0,
  score_breakdown JSONB NOT NULL DEFAULT '{}'::JSONB,
  evaluation_notes TEXT,
  valid_until TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 year'),
  is_current BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_csm_eval_contractor ON public.csm_prequal_evaluations(contractor_id, is_current);

-- 3. Safety Variance Requests (For Conditional Grade C or Restricted Contractors)
CREATE TABLE IF NOT EXISTS public.csm_contractor_variances (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id TEXT NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  contractor_id TEXT NOT NULL REFERENCES public.csm_contractor_profiles(id) ON DELETE CASCADE,
  variance_number TEXT NOT NULL,
  title TEXT NOT NULL,
  reason_category TEXT NOT NULL DEFAULT 'GRADE_C_CONDITIONAL', -- 'GRADE_C_CONDITIONAL', 'EXPIRED_INSURANCE_GRACE', 'SPECIALIZED_EQUIPMENT_EXEMPTION', 'EMERGENCY_REPAIR'
  justification TEXT NOT NULL,
  work_scope TEXT NOT NULL,
  target_unit_id TEXT,
  target_site_id TEXT,
  required_mitigations TEXT[] NOT NULL DEFAULT '{}',
  starts_at DATE NOT NULL DEFAULT CURRENT_DATE,
  expires_at DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
  status TEXT NOT NULL DEFAULT 'PENDING_APPROVAL', -- 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'EXPIRED', 'REVOKED'
  requested_by_user_id TEXT NOT NULL,
  approver_user_id TEXT,
  approved_at TIMESTAMPTZ,
  approval_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_csm_variances_contractor ON public.csm_contractor_variances(contractor_id, status);

-- 4. Enable RLS
ALTER TABLE public.csm_contractor_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.csm_prequal_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.csm_contractor_variances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS csm_metrics_all ON public.csm_contractor_metrics;
CREATE POLICY csm_metrics_all ON public.csm_contractor_metrics FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS csm_eval_all ON public.csm_prequal_evaluations;
CREATE POLICY csm_eval_all ON public.csm_prequal_evaluations FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS csm_var_all ON public.csm_contractor_variances;
CREATE POLICY csm_var_all ON public.csm_contractor_variances FOR ALL USING (true) WITH CHECK (true);

-- 5. Seed Historical 3-Year Metrics & Baseline Variances
DO $$
DECLARE
  v_tenant TEXT := 'tenant_alkylation';
  v_apex_id TEXT := 'csm_apex_piping_01';
  v_safeline_id TEXT := 'csm_safeline_scaffold_02';
  v_vanguard_id TEXT := 'csm_vanguard_elec_03';
  v_clean_id TEXT := 'csm_enviro_clean_04';
  v_pinnacle_id TEXT := 'csm_pinnacle_insul_05';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "Tenant" WHERE id = v_tenant) THEN
    SELECT id INTO v_tenant FROM "Tenant" LIMIT 1;
  END IF;

  IF v_tenant IS NOT NULL THEN
    -- Seed Apex (Grade A: TRIR ~ 0.45, EMR 0.76)
    INSERT INTO public.csm_contractor_metrics (tenant_id, contractor_id, year, total_hours_worked, fatalities_count, recordable_cases_count, dart_cases_count, trir, dart_rate, emr, emr_carrier, osha_citations_count)
    VALUES
      (v_tenant, v_apex_id, 2025, 420000, 0, 1, 0, 0.476, 0.000, 0.740, 'Travelers Property Casualty', 0),
      (v_tenant, v_apex_id, 2024, 385000, 0, 1, 1, 0.519, 0.519, 0.760, 'Travelers Property Casualty', 0),
      (v_tenant, v_apex_id, 2023, 410000, 0, 0, 0, 0.000, 0.000, 0.780, 'Travelers Property Casualty', 0)
    ON CONFLICT (contractor_id, year) DO NOTHING;

    -- Seed Safeline (Grade A: TRIR ~ 0.62, EMR 0.81)
    INSERT INTO public.csm_contractor_metrics (tenant_id, contractor_id, year, total_hours_worked, fatalities_count, recordable_cases_count, dart_cases_count, trir, dart_rate, emr, emr_carrier, osha_citations_count)
    VALUES
      (v_tenant, v_safeline_id, 2025, 310000, 0, 1, 1, 0.645, 0.645, 0.800, 'Liberty Mutual', 0),
      (v_tenant, v_safeline_id, 2024, 290000, 0, 1, 0, 0.690, 0.000, 0.820, 'Liberty Mutual', 0),
      (v_tenant, v_safeline_id, 2023, 305000, 0, 1, 1, 0.656, 0.656, 0.810, 'Liberty Mutual', 0)
    ON CONFLICT (contractor_id, year) DO NOTHING;

    -- Seed Vanguard (Grade B: TRIR ~ 1.45, EMR 0.94)
    INSERT INTO public.csm_contractor_metrics (tenant_id, contractor_id, year, total_hours_worked, fatalities_count, recordable_cases_count, dart_cases_count, trir, dart_rate, emr, emr_carrier, osha_citations_count)
    VALUES
      (v_tenant, v_vanguard_id, 2025, 210000, 0, 2, 1, 1.905, 0.952, 0.950, 'Hartford Underwriters', 0),
      (v_tenant, v_vanguard_id, 2024, 195000, 0, 1, 0, 1.026, 0.000, 0.920, 'Hartford Underwriters', 0),
      (v_tenant, v_vanguard_id, 2023, 180000, 0, 1, 1, 1.111, 1.111, 0.940, 'Hartford Underwriters', 0)
    ON CONFLICT (contractor_id, year) DO NOTHING;

    -- Seed Apex Environmental (Grade C: TRIR ~ 2.65, EMR 1.12)
    INSERT INTO public.csm_contractor_metrics (tenant_id, contractor_id, year, total_hours_worked, fatalities_count, recordable_cases_count, dart_cases_count, trir, dart_rate, emr, emr_carrier, osha_citations_count)
    VALUES
      (v_tenant, v_clean_id, 2025, 145000, 0, 2, 2, 2.759, 2.759, 1.140, 'Texas Mutual Insurance', 1),
      (v_tenant, v_clean_id, 2024, 130000, 0, 2, 1, 3.077, 1.538, 1.110, 'Texas Mutual Insurance', 0),
      (v_tenant, v_clean_id, 2023, 150000, 0, 1, 1, 1.333, 1.333, 1.100, 'Texas Mutual Insurance', 0)
    ON CONFLICT (contractor_id, year) DO NOTHING;

    -- Seed Pinnacle (Grade A: TRIR ~ 0.55, EMR 0.85)
    INSERT INTO public.csm_contractor_metrics (tenant_id, contractor_id, year, total_hours_worked, fatalities_count, recordable_cases_count, dart_cases_count, trir, dart_rate, emr, emr_carrier, osha_citations_count)
    VALUES
      (v_tenant, v_pinnacle_id, 2025, 175000, 0, 0, 0, 0.000, 0.000, 0.840, 'Zurich American', 0),
      (v_tenant, v_pinnacle_id, 2024, 160000, 0, 1, 0, 1.250, 0.000, 0.860, 'Zurich American', 0),
      (v_tenant, v_pinnacle_id, 2023, 165000, 0, 0, 0, 0.000, 0.000, 0.850, 'Zurich American', 0)
    ON CONFLICT (contractor_id, year) DO NOTHING;

    -- Seed Evaluation Record for Apex
    INSERT INTO public.csm_prequal_evaluations (
      tenant_id, contractor_id, overall_score, safety_grade, three_year_avg_trir, three_year_avg_dart,
      current_emr, fatalities_in_three_years, citations_in_three_years, score_breakdown, evaluation_notes
    ) VALUES (
      v_tenant, v_apex_id, 96.50, 'A', 0.332, 0.173, 0.740, 0, 0,
      '{"emrScore": 30, "trirScore": 30, "fatalityScore": 20, "dartScore": 8.5, "programScore": 8.0}'::JSONB,
      'Preferred Tier 1 mechanical vendor with outstanding multi-year safety performance.'
    );

    -- Seed Active Variance for Grade C Contractor (Apex Environmental)
    INSERT INTO public.csm_contractor_variances (
      tenant_id, contractor_id, variance_number, title, reason_category, justification, work_scope,
      target_unit_id, target_site_id, required_mitigations, starts_at, expires_at, status, requested_by_user_id,
      approver_user_id, approved_at, approval_notes
    ) VALUES (
      v_tenant, v_clean_id, 'VAR-CSM-2026-001',
      'Turnaround Tank Desludging - Conditional Grade C Authorization',
      'GRADE_C_CONDITIONAL',
      'Apex Environmental possesses specialized robotic high-pressure nozzle crawlers required for cleaning Tank T-104 without requiring personnel internal vessel entry.',
      'Robotic desludging and hazardous sludge neutralization on Alkylation Tank T-104.',
      'unit_alkylation', 'site_refinery_north',
      ARRAY[
        '100% full-time dedicated plant safety watcher on tank platform during all pumping hours',
        'Daily morning JSA audit and atmospheric gas re-testing before line hookup',
        'Direct supervision by Operations Shift Lead for all high-pressure hose connections'
      ],
      CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '25 days',
      'APPROVED', 'user_marcus_safety_eng', 'user_imran_shah', NOW() - INTERVAL '4 days',
      'Approved on condition that robotic cleaning is used exclusively and plant safety watcher logs all entries.'
    );

  END IF;
END $$;
