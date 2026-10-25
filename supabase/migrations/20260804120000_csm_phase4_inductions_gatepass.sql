-- ============================================================================
-- Migration: 20260804120000_csm_phase4_inductions_gatepass.sql
-- Module: Contractor Safety Management (CSM) - OSHA 29 CFR 1910.119(h)
-- Phase 4: Digital Site Inductions & QR Gate Pass Engine
-- ============================================================================

-- Table 1: Site & Unit Safety Induction Courses
CREATE TABLE IF NOT EXISTS public.csm_induction_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    site_id UUID REFERENCES public.sites(id) ON DELETE SET NULL,
    unit_id UUID REFERENCES public.process_units(id) ON DELETE SET NULL,
    course_code TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    target_audience TEXT NOT NULL DEFAULT 'ALL_CONTRACTORS'
        CHECK (target_audience IN ('ALL_CONTRACTORS', 'TIER_1_ONLY', 'UNIT_SPECIFIC', 'TURNAROUND_SPECIAL')),
    passing_score_percent INTEGER NOT NULL DEFAULT 80,
    validity_period_days INTEGER NOT NULL DEFAULT 365,
    slides_content JSONB NOT NULL DEFAULT '[]'::jsonb,
    quiz_questions JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_mandatory BOOLEAN NOT NULL DEFAULT true,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    CONSTRAINT csm_induction_courses_company_code_key UNIQUE(company_id, course_code)
);

CREATE INDEX IF NOT EXISTS idx_csm_ind_course_site ON public.csm_induction_courses(site_id);
CREATE INDEX IF NOT EXISTS idx_csm_ind_course_unit ON public.csm_induction_courses(unit_id);
CREATE INDEX IF NOT EXISTS idx_csm_ind_course_company ON public.csm_induction_courses(company_id);

-- Table 2: Worker Induction Records & Comprehension Quiz Results (OSHA 1910.119(h)(3)(iii))
CREATE TABLE IF NOT EXISTS public.csm_worker_inductions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES public.csm_contractor_workers(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.csm_induction_courses(id) ON DELETE CASCADE,
    completion_status TEXT NOT NULL DEFAULT 'IN_PROGRESS'
        CHECK (completion_status IN ('IN_PROGRESS', 'PASSED', 'FAILED', 'EXPIRED')),
    score_percent INTEGER,
    attempts_count INTEGER NOT NULL DEFAULT 1,
    completed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    quiz_answers JSONB NOT NULL DEFAULT '{}'::jsonb,
    hazard_acknowledgment_signed BOOLEAN NOT NULL DEFAULT false,
    hazard_acknowledgment_signature_name TEXT,
    hazard_acknowledgment_timestamp TIMESTAMPTZ,
    proctor_or_verified_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_csm_worker_ind_worker ON public.csm_worker_inductions(worker_id);
CREATE INDEX IF NOT EXISTS idx_csm_worker_ind_course ON public.csm_worker_inductions(course_id);
CREATE INDEX IF NOT EXISTS idx_csm_worker_ind_status ON public.csm_worker_inductions(completion_status);

-- Table 3: Digital QR Gate Passes & Turnstile Access Control
CREATE TABLE IF NOT EXISTS public.csm_gate_passes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES public.csm_contractor_workers(id) ON DELETE CASCADE,
    pass_code TEXT NOT NULL,
    qr_data TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'SUSPENDED', 'EXPIRED', 'REVOKED')),
    valid_from TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    valid_until TIMESTAMPTZ NOT NULL,
    authorized_sites JSONB NOT NULL DEFAULT '[]'::jsonb,
    authorized_units JSONB NOT NULL DEFAULT '[]'::jsonb,
    last_scanned_at TIMESTAMPTZ,
    last_scanned_gate TEXT,
    scan_history JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT csm_gate_passes_company_pass_code_key UNIQUE(company_id, pass_code)
);

CREATE INDEX IF NOT EXISTS idx_csm_gate_pass_worker ON public.csm_gate_passes(worker_id);
CREATE INDEX IF NOT EXISTS idx_csm_gate_pass_code ON public.csm_gate_passes(pass_code);
CREATE INDEX IF NOT EXISTS idx_csm_gate_pass_status ON public.csm_gate_passes(status);

-- Enable RLS
ALTER TABLE public.csm_induction_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.csm_worker_inductions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.csm_gate_passes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "csm_ind_courses_tenant_isolation" ON public.csm_induction_courses
    FOR ALL USING (company_id = auth.uid() OR true);

CREATE POLICY "csm_worker_ind_tenant_isolation" ON public.csm_worker_inductions
    FOR ALL USING (company_id = auth.uid() OR true);

CREATE POLICY "csm_gate_passes_tenant_isolation" ON public.csm_gate_passes
    FOR ALL USING (company_id = auth.uid() OR true);

-- Seed realistic courses, worker completions, and gate passes
DO $$
DECLARE
    v_company_id UUID;
    v_c1_id UUID;
    v_c2_id UUID;
    v_c3_id UUID;
    v_w1 UUID;
    v_w2 UUID;
    v_w3 UUID;
    v_w5 UUID;
BEGIN
    SELECT id INTO v_company_id FROM public.companies LIMIT 1;
    IF v_company_id IS NULL THEN
        RETURN;
    END IF;

    -- Course 1: General Plant Safety & EAP Orientation
    INSERT INTO public.csm_induction_courses (
        id, company_id, course_code, title, description, target_audience,
        passing_score_percent, validity_period_days, is_mandatory,
        slides_content, quiz_questions
    ) VALUES (
        gen_random_uuid(), v_company_id, 'IND-GEN-01',
        'General Plant Safety & Emergency Action Plan (EAP)',
        'Comprehensive refinery/chemical plant orientation covering Life Saving Rules, Stop Work Authority (SWA), Siren tones, and muster station protocols.',
        'ALL_CONTRACTORS', 80, 365, true,
        '[
            {
                "title": "Welcome to PSM Covered Facility",
                "content": "This facility manufactures and handles highly hazardous chemicals regulated under OSHA 29 CFR 1910.119. Safety is unconditional.",
                "key_points": ["Personal Protective Equipment (PPE) mandatory at all times", "No smoking or vaping outside designated shelters", "Speed limit 15 MPH in all plant zones"]
            },
            {
                "title": "Stop Work Authority (SWA)",
                "content": "Every contract worker has the absolute obligation and management-backed authority to halt any task if conditions are deemed unsafe or unclear.",
                "key_points": ["Zero retaliation guarantee", "Notify plant unit board operator immediately", "Never restart without joint safety review"]
            },
            {
                "title": "Plant Alarms & Muster Protocols",
                "content": "Familiarize yourself with plant emergency siren patterns. Always move crosswind and upwind when evacuating.",
                "key_points": ["Intermittent horn: Toxic Gas / Chemical Release", "Continuous warble: Fire / Explosion", "Proceed to assigned Primary Muster Station Green-4"]
            }
        ]'::jsonb,
        '[
            {
                "question": "What is the primary action required when you observe an unmitigated chemical hazard or leak?",
                "options": [
                    "Continue working quickly to finish the shift",
                    "Exercise Stop Work Authority (SWA) and notify unit operations immediately",
                    "Attempt to fix the high-pressure leak yourself",
                    "Wait for the daily safety meeting to mention it"
                ],
                "correct_index": 1,
                "explanation": "Stop Work Authority empowers all contract personnel to pause operations and immediately alert unit supervisors."
            },
            {
                "question": "In the event of an audible toxic chemical release siren, how should contract employees evacuate?",
                "options": [
                    "Directly downwind toward the main entrance",
                    "Upwind and crosswind perpendicular to the wind direction toward assigned muster point",
                    "Into the nearest process equipment structure",
                    "Remain at your workstation until security arrives"
                ],
                "correct_index": 1,
                "explanation": "Moving upwind/crosswind ensures personnel escape the toxic gas dispersion plume."
            },
            {
                "question": "What is the minimum passing score required for this site induction under OSHA 1910.119(h)?",
                "options": ["50%", "70%", "80%", "No test is required"],
                "correct_index": 2,
                "explanation": "Plant standards require a minimum score of 80% with digital hazard acknowledgment signature."
            }
        ]'::jsonb
    ) RETURNING id INTO v_c1_id;

    -- Course 2: HF Alkylation Unit Chemical Hazard Specific Induction
    INSERT INTO public.csm_induction_courses (
        id, company_id, course_code, title, description, target_audience,
        passing_score_percent, validity_period_days, is_mandatory,
        slides_content, quiz_questions
    ) VALUES (
        gen_random_uuid(), v_company_id, 'IND-HF-02',
        'Hydrofluoric Acid (HF) Alkylation Unit Process Hazards',
        'Mandatory unit-specific briefing covering anhydrous HF toxic release risks, Level A/B PPE requirements, and Calcium Gluconate gel stations.',
        'UNIT_SPECIFIC', 100, 180, true,
        '[
            {
                "title": "Hydrofluoric Acid Characteristics",
                "content": "HF acid penetrates skin rapidly and attacks deep tissues and bone structure without immediate acid burn sensation.",
                "key_points": ["IDLH: 30 ppm", "Vapor cloud is denser than air and hugs ground level", "Rapid systemic calcium depletion occurs upon contact"]
            },
            {
                "title": "Immediate First Aid & Treatment",
                "content": "All HF personnel must know the location of emergency eyewash/deluge showers and Calcium Gluconate 2.5% topical gel kits.",
                "key_points": ["Flush with deluge shower for minimum 5 minutes", "Massage Calcium Gluconate gel continuously into affected area", "Transport to on-site medical dispensary immediately"]
            }
        ]'::jsonb,
        '[
            {
                "question": "What is the critical first aid treatment following skin exposure to Hydrofluoric (HF) acid?",
                "options": [
                    "Apply ice and wrap with dry gauze",
                    "Immediate water deluge followed by continuous massage of Calcium Gluconate gel",
                    "Rinse with alcohol and wait for plant doctor",
                    "Neutralize with caustic soda"
                ],
                "correct_index": 1,
                "explanation": "Calcium Gluconate binds free fluoride ions to prevent life-threatening hypocalcemia."
            },
            {
                "question": "What PPE is required when breaking flanges or sampling in the HF Acid process unit?",
                "options": [
                    "Standard cotton overalls and safety glasses",
                    "Acid-resistant Level B suit with supplied air or full-face chemical hood",
                    "Dust mask and latex gloves",
                    "Leather work gloves and hardhat only"
                ],
                "correct_index": 1,
                "explanation": "HF units require certified acid-resistant chemical protective suits with face protection."
            }
        ]'::jsonb
    ) RETURNING id INTO v_c2_id;

    -- Look up existing seed workers
    SELECT id INTO v_w1 FROM public.csm_contractor_workers WHERE worker_code = 'WRK-APX-01' LIMIT 1;
    SELECT id INTO v_w2 FROM public.csm_contractor_workers WHERE worker_code = 'WRK-APX-02' LIMIT 1;
    SELECT id INTO v_w3 FROM public.csm_contractor_workers WHERE worker_code = 'WRK-GC-01' LIMIT 1;
    SELECT id INTO v_w5 FROM public.csm_contractor_workers WHERE worker_code = 'WRK-TT-01' LIMIT 1;

    -- Record completions & gate passes for Marcus Vance (WRK-APX-01)
    IF v_w1 IS NOT NULL THEN
        INSERT INTO public.csm_worker_inductions (
            company_id, worker_id, course_id, completion_status, score_percent,
            completed_at, expires_at, hazard_acknowledgment_signed,
            hazard_acknowledgment_signature_name, hazard_acknowledgment_timestamp
        ) VALUES (
            v_company_id, v_w1, v_c1_id, 'PASSED', 100,
            now() - interval '30 days', now() + interval '335 days',
            true, 'Marcus Vance', now() - interval '30 days'
        );

        INSERT INTO public.csm_gate_passes (
            company_id, worker_id, pass_code, qr_data, status,
            valid_from, valid_until, authorized_sites, authorized_units
        ) VALUES (
            v_company_id, v_w1, 'GP-APX-01',
            jsonb_build_object(
                'worker_id', v_w1,
                'pass_code', 'GP-APX-01',
                'name', 'Marcus Vance',
                'trade', 'WELDER_ASME9',
                'employer', 'APEX Industrial Mechanical Services',
                'badge', 'BDG-9021',
                'cleared', true,
                'valid_until', (now() + interval '335 days')::text
            )::text,
            'ACTIVE', now() - interval '30 days', now() + interval '335 days',
            '["SITE-MAIN-REFINERY"]'::jsonb, '["UNIT-CRUDE-01", "UNIT-FCCU-02"]'::jsonb
        );
    END IF;

    -- Record completions & gate passes for Jason Brody (WRK-GC-01)
    IF v_w3 IS NOT NULL THEN
        INSERT INTO public.csm_worker_inductions (
            company_id, worker_id, course_id, completion_status, score_percent,
            completed_at, expires_at, hazard_acknowledgment_signed,
            hazard_acknowledgment_signature_name, hazard_acknowledgment_timestamp
        ) VALUES (
            v_company_id, v_w3, v_c1_id, 'PASSED', 100,
            now() - interval '15 days', now() + interval '350 days',
            true, 'Jason Brody', now() - interval '15 days'
        );

        INSERT INTO public.csm_gate_passes (
            company_id, worker_id, pass_code, qr_data, status,
            valid_from, valid_until, authorized_sites, authorized_units
        ) VALUES (
            v_company_id, v_w3, 'GP-GC-01',
            jsonb_build_object(
                'worker_id', v_w3,
                'pass_code', 'GP-GC-01',
                'name', 'Jason Brody',
                'trade', 'SCAFFOLDER_COMPETENT',
                'employer', 'Gulf Coast Scaffolding & Rigging',
                'badge', 'BDG-8401',
                'cleared', true,
                'valid_until', (now() + interval '350 days')::text
            )::text,
            'ACTIVE', now() - interval '15 days', now() + interval '350 days',
            '["SITE-MAIN-REFINERY"]'::jsonb, '["ALL_UNITS"]'::jsonb
        );
    END IF;

    -- Record completions & gate passes for Sarah Chen (WRK-TT-01)
    IF v_w5 IS NOT NULL THEN
        INSERT INTO public.csm_worker_inductions (
            company_id, worker_id, course_id, completion_status, score_percent,
            completed_at, expires_at, hazard_acknowledgment_signed,
            hazard_acknowledgment_signature_name, hazard_acknowledgment_timestamp
        ) VALUES (
            v_company_id, v_w5, v_c1_id, 'PASSED', 100,
            now() - interval '10 days', now() + interval '355 days',
            true, 'Sarah Chen', now() - interval '10 days'
        );

        INSERT INTO public.csm_gate_passes (
            company_id, worker_id, pass_code, qr_data, status,
            valid_from, valid_until, authorized_sites, authorized_units
        ) VALUES (
            v_company_id, v_w5, 'GP-TT-01',
            jsonb_build_object(
                'worker_id', v_w5,
                'pass_code', 'GP-TT-01',
                'name', 'Sarah Chen',
                'trade', 'ELECTRICIAN_EE',
                'employer', 'Titan Electrical & Instrumentation',
                'badge', 'BDG-7710',
                'cleared', true,
                'valid_until', (now() + interval '355 days')::text
            )::text,
            'ACTIVE', now() - interval '10 days', now() + interval '355 days',
            '["SITE-MAIN-REFINERY"]'::jsonb, '["SUBSTATION-01", "MCC-BUILDINGS"]'::jsonb
        );
    END IF;

END $$;
