-- ============================================================
-- OneNetworx Platform — Migration V4
-- Job-Specific Custom Application Fields Engine
-- ============================================================

-- 1. Create the Custom Fields Form Schema Table
CREATE TABLE IF NOT EXISTS public.custom_application_fields (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id uuid REFERENCES public.job_positions(id) ON DELETE CASCADE,
  field_label text NOT NULL,
  field_name text NOT NULL, -- The programmatic key, e.g., 'linkedin_url'
  field_type text NOT NULL CHECK (field_type IN ('text', 'email', 'tel', 'url', 'long_text')),
  is_required boolean DEFAULT false,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- RLS Enforcement
ALTER TABLE public.custom_application_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active custom fields"
  ON public.custom_application_fields FOR SELECT
  USING (true); -- Requires no auth because applicants need to view the form schema

CREATE POLICY "Staff can manage custom fields"
  ON public.custom_application_fields FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'hr_admin', 'screener')
    )
  );

-- 2. Modify Applications Table
-- Safely add the custom_data bucket to catch applicant responses mapping to these fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'applications' AND column_name = 'custom_data'
  ) THEN
    ALTER TABLE public.applications ADD COLUMN custom_data jsonb DEFAULT '{}';
  END IF;
END $$;
