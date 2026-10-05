-- ============================================================
-- FIX: profiles_role_check constraint violation
-- Run this in the Supabase SQL Editor BEFORE the full migration
-- ============================================================

BEGIN;

-- 1. Inspect current roles (check output in Results tab)
SELECT role, COUNT(*) FROM public.profiles GROUP BY role;

-- 2. Drop ANY check constraint on the role column (handles auto-generated names)
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
      AND con.contype = 'c'  -- check constraints only
  LOOP
    EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT %I', r.conname);
    RAISE NOTICE 'Dropped constraint: %', r.conname;
  END LOOP;
END $$;

-- 3. Migrate ALL non-conforming roles
UPDATE public.profiles SET role = 'super_admin' WHERE role = 'admin';
UPDATE public.profiles SET role = 'applicant'
  WHERE role NOT IN ('applicant', 'screener', 'hr_admin', 'super_admin', 'agent');

-- 4. Verify — this should return 0 rows
SELECT id, role FROM public.profiles
  WHERE role NOT IN ('applicant', 'screener', 'hr_admin', 'super_admin', 'agent');

-- 5. Add the new constraint
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
    CHECK (role IN ('applicant', 'screener', 'hr_admin', 'super_admin', 'agent'));

COMMIT;
