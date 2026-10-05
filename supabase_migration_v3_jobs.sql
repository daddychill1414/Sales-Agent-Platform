-- ============================================================
-- OneNetworx Platform — Migration V3 (Job-Specific Pipelines)
-- Run this AFTER supabase_migration_v2.sql
-- ============================================================

-- WARNING: This migration permanently clears existing screening questions and exams
-- because they were global and must now be recreated specifically for individual jobs.

-- 1. Purge old global data to prevent orphan constraints
DELETE FROM public.screening_questions;
DELETE FROM public.exams;

-- 2. Add Job Position Foreign Key to Screening Questions
ALTER TABLE public.screening_questions
  ADD COLUMN job_id uuid REFERENCES public.job_positions(id) ON DELETE CASCADE;

-- Make it mandatory that a screening question belongs to a job
ALTER TABLE public.screening_questions
  ALTER COLUMN job_id SET NOT NULL;

-- 3. Add Job Position Foreign Key to Exams
ALTER TABLE public.exams
  ADD COLUMN job_id uuid REFERENCES public.job_positions(id) ON DELETE CASCADE;

-- Make it mandatory that an exam belongs to a job
ALTER TABLE public.exams
  ALTER COLUMN job_id SET NOT NULL;

-- 4. Update the trigger (Optional but good practice)
-- If you need to rebuild the RLS policies to check for job relationships, 
-- you can do so here. The original staff policies still apply broadly.
