-- ============================================================
-- OneNetworx Platform — Migration V2
-- Run this AFTER the original supabase_schema.sql
-- ============================================================

-- ============================================================
-- 1. EXPAND ROLE SYSTEM (5 tiers)
-- ============================================================

-- Step A: Drop ALL check constraints on the role column (handles auto-generated names)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_attribute att ON att.attnum = ANY(con.conkey)
      AND att.attrelid = con.conrelid
    WHERE con.conrelid = 'public.profiles'::regclass
      AND att.attname = 'role'
      AND con.contype = 'c'
  LOOP
    EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT %I', r.conname);
    RAISE NOTICE 'Dropped constraint: %', r.conname;
  END LOOP;
END $$;

-- Step B: Migrate existing roles to new role names
-- 'admin' → 'super_admin' (old admins become super admins)
UPDATE public.profiles SET role = 'super_admin' WHERE role = 'admin';
-- Any other legacy roles → 'applicant' (safe fallback)
UPDATE public.profiles SET role = 'applicant' WHERE role NOT IN ('applicant', 'screener', 'hr_admin', 'super_admin', 'agent');

-- Step C: Apply the new constraint
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check 
    CHECK (role IN ('applicant', 'screener', 'hr_admin', 'super_admin', 'agent'));

-- ============================================================
-- 2. APPLICATIONS TABLE (replaces writing to profiles directly)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.applications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tracking_code text UNIQUE NOT NULL,

  -- Personal Details
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text,

  -- Professional Background
  work_experience text,
  sales_background text,

  -- Resume
  resume_url text,

  -- Screening
  screening_responses jsonb DEFAULT '{}',
  screening_qualified boolean,
  screening_flags jsonb DEFAULT '[]',

  -- Job
  applied_position_id uuid,

  -- Legal Consent
  terms_accepted_at timestamptz,
  privacy_accepted_at timestamptz,

  -- Pipeline Stage
  stage text DEFAULT 'New' CHECK (stage IN (
    'New',
    'Screening Review',
    'Qualified',
    'Disqualified',
    'Account Invited',
    'Exam Assigned',
    'Exam Completed',
    'Interview Scheduled',
    'Interview Completed',
    'Offer Extended',
    'Contract Sent',
    'Contract Signed',
    'Hired',
    'Rejected',
    'Withdrawn'
  )),

  -- Link to auth account (NULL until magic link is accepted)
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS for applications
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Public can INSERT (submit applications without auth)
CREATE POLICY "Anyone can submit an application"
  ON public.applications FOR INSERT
  WITH CHECK (true);

-- Admins/Screeners can view all applications
CREATE POLICY "Staff can view all applications"
  ON public.applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'hr_admin', 'screener')
    )
  );

-- Admins can update applications (advance stage, etc.)
CREATE POLICY "Admins can update applications"
  ON public.applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'hr_admin')
    )
  );

-- Applicants can view their own application via user_id
CREATE POLICY "Applicants can view own applications"
  ON public.applications FOR SELECT
  USING (user_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER on_applications_updated
  BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();

-- ============================================================
-- 3. SCREENING QUESTIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.screening_questions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  question_text text NOT NULL,
  question_type text NOT NULL CHECK (question_type IN ('yes_no', 'multiple_choice', 'text', 'number_range')),
  options jsonb DEFAULT '[]',
  qualifying_answers jsonb DEFAULT '[]',
  priority text DEFAULT 'info' CHECK (priority IN ('critical', 'high', 'info')),
  is_required boolean DEFAULT true,
  order_index integer NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.screening_questions ENABLE ROW LEVEL SECURITY;

-- Anyone can read active screening questions (needed for the public form)
CREATE POLICY "Anyone can view active screening questions"
  ON public.screening_questions FOR SELECT
  USING (is_active = true);

-- Staff can manage screening questions
CREATE POLICY "Staff can manage screening questions"
  ON public.screening_questions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'hr_admin', 'screener')
    )
  );

-- ============================================================
-- 4. EVALUATION NOTES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.evaluation_notes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id uuid REFERENCES public.applications(id) ON DELETE CASCADE,
  author_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  content text NOT NULL,
  note_type text DEFAULT 'general' CHECK (note_type IN ('general', 'screening', 'interview', 'exam', 'system')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.evaluation_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage evaluation notes"
  ON public.evaluation_notes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'hr_admin', 'screener')
    )
  );

-- ============================================================
-- 5. CONTRACT TEMPLATES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.contract_templates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  content text NOT NULL,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage contract templates"
  ON public.contract_templates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'hr_admin')
    )
  );

-- ============================================================
-- 6. CONTRACTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.contracts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id uuid REFERENCES public.applications(id) ON DELETE CASCADE,
  template_id uuid REFERENCES public.contract_templates(id) ON DELETE SET NULL,
  rendered_content text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'viewed', 'signed', 'expired')),
  signed_name text,
  signed_at timestamptz,
  contract_pdf_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage contracts"
  ON public.contracts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'hr_admin')
    )
  );

CREATE POLICY "Users can view their own contracts"
  ON public.contracts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE applications.id = contracts.application_id
      AND applications.user_id = auth.uid()
    )
  );

-- ============================================================
-- 7. TRAINING MODULES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.training_modules (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  content text,
  video_url text,
  attachment_urls jsonb DEFAULT '[]',
  quiz_exam_id uuid REFERENCES public.exams(id) ON DELETE SET NULL,
  order_index integer NOT NULL DEFAULT 0,
  is_required boolean DEFAULT true,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.training_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage training modules"
  ON public.training_modules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'hr_admin')
    )
  );

CREATE POLICY "Agents can view active training modules"
  ON public.training_modules FOR SELECT
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'agent'
    )
  );

-- ============================================================
-- 8. TRAINING PROGRESS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.training_progress (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  module_id uuid REFERENCES public.training_modules(id) ON DELETE CASCADE,
  status text DEFAULT 'locked' CHECK (status IN ('locked', 'not_started', 'in_progress', 'completed')),
  completed_at timestamptz,
  quiz_score integer,
  UNIQUE(agent_id, module_id)
);

ALTER TABLE public.training_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view and update their own training progress"
  ON public.training_progress FOR ALL
  USING (agent_id = auth.uid());

CREATE POLICY "Admins can view all training progress"
  ON public.training_progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'hr_admin')
    )
  );

-- ============================================================
-- 9. AUDIT LOG TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_email text,
  user_role text,
  action text NOT NULL,
  description text,
  target_type text,
  target_id uuid,
  metadata jsonb DEFAULT '{}',
  ip_address text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only super admins can view audit logs"
  ON public.audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- Allow server-side inserts (service role key bypasses RLS)
-- No INSERT policy needed since audit events are logged via service role

-- ============================================================
-- 10. SITE SETTINGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read site settings (needed for public pages)
CREATE POLICY "Anyone can read site settings"
  ON public.site_settings FOR SELECT
  USING (true);

-- Only admins can update site settings
CREATE POLICY "Admins can manage site settings"
  ON public.site_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'hr_admin')
    )
  );

-- ============================================================
-- 11. EMAIL LOG TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.email_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id uuid REFERENCES public.applications(id) ON DELETE SET NULL,
  template_name text,
  subject text,
  recipient_email text,
  status text DEFAULT 'sent' CHECK (status IN ('queued', 'sent', 'delivered', 'failed')),
  sent_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  sent_at timestamptz DEFAULT now()
);

ALTER TABLE public.email_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view email logs"
  ON public.email_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'hr_admin')
    )
  );

-- ============================================================
-- 12. SEED DEFAULT SCREENING QUESTIONS
-- ============================================================
INSERT INTO public.screening_questions (question_text, question_type, options, qualifying_answers, priority, is_required, order_index) VALUES
  ('Are you at least 18 years old?', 'yes_no', '["Yes", "No"]', '["Yes"]', 'critical', true, 1),
  ('What is your highest educational attainment?', 'multiple_choice', '["College Graduate", "Undergraduate", "Senior High School", "Others"]', '["College Graduate"]', 'critical', true, 2),
  ('Are you legally authorized to work in the Philippines?', 'yes_no', '["Yes", "No"]', '["Yes"]', 'critical', true, 3),
  ('Do you have at least 1 year of sales experience?', 'yes_no', '["Yes", "No"]', '["Yes"]', 'high', true, 4),
  ('Are you comfortable with commission-based compensation?', 'yes_no', '["Yes", "No"]', '["Yes"]', 'critical', true, 5),
  ('Can you commit to full-time work?', 'multiple_choice', '["Full-time", "Part-time", "Flexible"]', '["Full-time", "Flexible"]', 'high', true, 6),
  ('Do you have your own laptop or device?', 'yes_no', '["Yes", "No"]', '["Yes"]', 'high', true, 7),
  ('How did you hear about OneNetworx?', 'multiple_choice', '["Social Media", "Referral", "Job Board", "Walk-in", "Others"]', '[]', 'info', true, 8)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 13. SEED DEFAULT SITE SETTINGS
-- ============================================================
INSERT INTO public.site_settings (key, value) VALUES
  ('hero', '{"headline": "be your own", "headline_accent": "Boss.", "subtitle": "Relatable, rewarding, and built for you. Discover multiple income opportunities and gain unmatched experience.", "cta_text": "Apply Now", "cta_link": "/apply"}'),
  ('legal_terms', '{"content": "Terms of Service content goes here. This should be edited by the administrator."}'),
  ('legal_privacy', '{"content": "Data Privacy Policy content goes here. This should be edited by the administrator."}')
ON CONFLICT (key) DO NOTHING;
