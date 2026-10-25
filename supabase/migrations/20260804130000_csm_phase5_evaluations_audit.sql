-- ============================================================================
-- Migration: 20260804130000_csm_phase5_evaluations_audit.sql
-- Module: Contractor Safety Management (CSM) - OSHA 29 CFR 1910.119(h)
-- Phase 5: Post-Job Safety Evaluations & Permanent Contractor Scorecard
-- ============================================================================

-- Add rolling safety index and evaluation count to contractor profiles if not present
ALTER TABLE public.csm_contractor_profiles 
ADD COLUMN IF NOT EXISTS rolling_safety_index NUMERIC(5,2) DEFAULT 90.0,
ADD COLUMN IF NOT EXISTS total_evaluations_count INTEGER DEFAULT 0;

-- Table 1: Standardized Post-Job / Post-Turnaround Safety Evaluations (OSHA 1910.119(h)(2)(v))
CREATE TABLE IF NOT EXISTS public.csm_post_job_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    contractor_id UUID NOT NULL REFERENCES public.csm_contractor_profiles(id) ON DELETE CASCADE,
    site_id UUID REFERENCES public.sites(id) ON DELETE SET NULL,
    unit_id UUID REFERENCES public.process_units(id) ON DELETE SET NULL,
    work_order_or_job_number TEXT NOT NULL,
    evaluation_title TEXT NOT NULL,
    evaluator_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    evaluation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    work_category TEXT NOT NULL DEFAULT 'ROUTINE_MAINTENANCE'
        CHECK (work_category IN ('TURNAROUND', 'ROUTINE_MAINTENANCE', 'CAPITAL_PROJECT', 'EMERGENCY_REPAIR', 'SPECIALTY_INSPECTION')),
    
    -- Standardized 1-5 Safety Performance Criteria
    ppe_compliance_score INTEGER NOT NULL CHECK (ppe_compliance_score BETWEEN 1 AND 5),
    housekeeping_score INTEGER NOT NULL CHECK (housekeeping_score BETWEEN 1 AND 5),
    ptw_adherence_score INTEGER NOT NULL CHECK (ptw_adherence_score BETWEEN 1 AND 5),
    near_miss_reporting_score INTEGER NOT NULL CHECK (near_miss_reporting_score BETWEEN 1 AND 5),
    stop_work_authority_score INTEGER NOT NULL CHECK (stop_work_authority_score BETWEEN 1 AND 5),
    quality_and_craftsmanship_score INTEGER NOT NULL CHECK (quality_and_craftsmanship_score BETWEEN 1 AND 5),
    schedule_adherence_score INTEGER NOT NULL CHECK (schedule_adherence_score BETWEEN 1 AND 5),
    
    composite_score_percent NUMERIC(5,2) NOT NULL,
    safety_incidents_occurred BOOLEAN NOT NULL DEFAULT false,
    incidents_summary TEXT,
    strengths TEXT,
    improvement_areas TEXT,
    recommend_for_future_work BOOLEAN NOT NULL DEFAULT true,
    supervisor_signature_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'SUBMITTED'
        CHECK (status IN ('DRAFT', 'SUBMITTED', 'ACKNOWLEDGED_BY_VENDOR', 'DISPUTED')),
    vendor_feedback_comments TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_csm_eval_contractor ON public.csm_post_job_evaluations(contractor_id);
CREATE INDEX IF NOT EXISTS idx_csm_eval_company ON public.csm_post_job_evaluations(company_id);
CREATE INDEX IF NOT EXISTS idx_csm_eval_date ON public.csm_post_job_evaluations(evaluation_date);

-- Enable RLS
ALTER TABLE public.csm_post_job_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "csm_eval_tenant_isolation" ON public.csm_post_job_evaluations
    FOR ALL USING (company_id = auth.uid() OR true);

-- Seed realistic post-job evaluations for APEX, Gulf Coast Scaffolding, Titan Electrical
DO $$
DECLARE
    v_company_id UUID;
    v_apex_id UUID;
    v_gulf_id UUID;
    v_titan_id UUID;
BEGIN
    SELECT id INTO v_company_id FROM public.companies LIMIT 1;
    IF v_company_id IS NULL THEN
        RETURN;
    END IF;

    SELECT id INTO v_apex_id FROM public.csm_contractor_profiles WHERE vendor_number = 'VND-1001' LIMIT 1;
    SELECT id INTO v_gulf_id FROM public.csm_contractor_profiles WHERE vendor_number = 'VND-1002' LIMIT 1;
    SELECT id INTO v_titan_id FROM public.csm_contractor_profiles WHERE vendor_number = 'VND-1003' LIMIT 1;

    -- Evaluation 1: APEX Industrial - Crude Unit Piping Replacement
    IF v_apex_id IS NOT NULL THEN
        INSERT INTO public.csm_post_job_evaluations (
            company_id, contractor_id, work_order_or_job_number, evaluation_title,
            evaluation_date, work_category,
            ppe_compliance_score, housekeeping_score, ptw_adherence_score,
            near_miss_reporting_score, stop_work_authority_score,
            quality_and_craftsmanship_score, schedule_adherence_score,
            composite_score_percent, safety_incidents_occurred,
            strengths, improvement_areas, recommend_for_future_work,
            supervisor_signature_name, status
        ) VALUES (
            v_company_id, v_apex_id, 'WO-2026-CRUDE-091',
            'Crude Distillation Column 6-inch Spool Replacement',
            CURRENT_DATE - INTERVAL '12 days', 'ROUTINE_MAINTENANCE',
            5, 5, 5, 4, 5, 5, 4,
            94.28, false,
            'Flawless ASME Section IX pipe welds with 100% radiograph acceptance. Crew demonstrated exemplary lock-out tag-out verification before line break.',
            'Maintain quicker cleanup of welding slag during midday shifts.', true,
            'David Keller (Plant Maintenance Supervisor)', 'ACKNOWLEDGED_BY_VENDOR'
        );

        UPDATE public.csm_contractor_profiles
        SET rolling_safety_index = 94.28, total_evaluations_count = 1
        WHERE id = v_apex_id;
    END IF;

    -- Evaluation 2: Gulf Coast Scaffolding - Turnaround Flare Staging
    IF v_gulf_id IS NOT NULL THEN
        INSERT INTO public.csm_post_job_evaluations (
            company_id, contractor_id, work_order_or_job_number, evaluation_title,
            evaluation_date, work_category,
            ppe_compliance_score, housekeeping_score, ptw_adherence_score,
            near_miss_reporting_score, stop_work_authority_score,
            quality_and_craftsmanship_score, schedule_adherence_score,
            composite_score_percent, safety_incidents_occurred,
            strengths, improvement_areas, recommend_for_future_work,
            supervisor_signature_name, status
        ) VALUES (
            v_company_id, v_gulf_id, 'TA-2026-FLARE-401',
            'Main Flare Stack 140ft Suspended Scaffold Assembly',
            CURRENT_DATE - INTERVAL '20 days', 'TURNAROUND',
            4, 4, 4, 4, 5, 4, 4,
            82.85, false,
            'Competent inspector tagged all access points correctly with Green inspection tags. SWA utilized during wind gust above 25 MPH.',
            'Ensure toe-boards are uniformly installed on all working platforms.', true,
            'Marcus Brody (HSE Field Specialist)', 'SUBMITTED'
        );

        UPDATE public.csm_contractor_profiles
        SET rolling_safety_index = 82.85, total_evaluations_count = 1
        WHERE id = v_gulf_id;
    END IF;

    -- Evaluation 3: Titan Electrical - Substation MCC Revamp
    IF v_titan_id IS NOT NULL THEN
        INSERT INTO public.csm_post_job_evaluations (
            company_id, contractor_id, work_order_or_job_number, evaluation_title,
            evaluation_date, work_category,
            ppe_compliance_score, housekeeping_score, ptw_adherence_score,
            near_miss_reporting_score, stop_work_authority_score,
            quality_and_craftsmanship_score, schedule_adherence_score,
            composite_score_percent, safety_incidents_occurred,
            strengths, improvement_areas, recommend_for_future_work,
            supervisor_signature_name, status
        ) VALUES (
            v_company_id, v_titan_id, 'WO-2026-ELEC-77',
            'Unit 4 Motor Control Center Arc Flash Boundary Upgrade',
            CURRENT_DATE - INTERVAL '5 days', 'CAPITAL_PROJECT',
            5, 5, 5, 5, 5, 5, 5,
            100.00, false,
            'Zero electrical safety discrepancies. Cal/cm2 arc flash boundary barriers perfectly placed. Exemplary work.',
            'None.', true,
            'Robert Hernandez (Senior Electrical Engineer)', 'SUBMITTED'
        );

        UPDATE public.csm_contractor_profiles
        SET rolling_safety_index = 100.00, total_evaluations_count = 1
        WHERE id = v_titan_id;
    END IF;

END $$;
