-- ============================================================
-- OneNetworx Platform — Migration V5
-- Add section classification to custom_application_fields
-- ============================================================

-- Add section column to differentiate between Personal Details (Step 1) and Professional Background (Step 2)
ALTER TABLE public.custom_application_fields 
ADD COLUMN IF NOT EXISTS section text NOT NULL DEFAULT 'personal_details' 
CHECK (section IN ('personal_details', 'professional_background'));
