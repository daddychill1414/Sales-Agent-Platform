-- supabase_schema.sql

-- 1. Create tables
CREATE TABLE public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  role text not null default 'applicant' check (role in ('applicant', 'admin')),
  full_name text,
  first_name text,
  last_name text,
  phone text,
  work_experience text,
  sales_background text,
  resume_url text,
  stage text default 'Application Submitted' check (stage in ('Application Submitted', 'Under Review', 'Exam Scheduled', 'Exam Completed', 'Interview Scheduled', 'Interview Completed', 'Hired', 'Rejected')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

CREATE TABLE public.news_articles (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  content text not null,
  author_id uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies for Profiles
CREATE POLICY "Users can view their own profile." 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile." 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id) 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles." 
  ON public.profiles FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all profiles." 
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 4. RLS Policies for News Articles
CREATE POLICY "Anyone can view news articles." 
  ON public.news_articles FOR SELECT 
  USING (true);

CREATE POLICY "Admins can insert news articles." 
  ON public.news_articles FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update news articles." 
  ON public.news_articles FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete news articles." 
  ON public.news_articles FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 5. Trigger for updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER on_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();

-- 6. Trigger to automatically create a profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', 'applicant');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 7. Resumes Storage Bucket
-- (Run this ONLY if you haven't created the bucket in the UI)
INSERT INTO storage.buckets (id, name, public) VALUES ('resumes', 'resumes', false) ON CONFLICT DO NOTHING;

CREATE POLICY "Applicants can upload their own resume"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Applicants can read their own resume"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all resumes"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'resumes' AND EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 8. Exams Management
CREATE TABLE public.exams (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

CREATE TABLE public.exam_questions (
  id uuid default gen_random_uuid() primary key,
  exam_id uuid references public.exams(id) on delete cascade not null,
  question_text text not null,
  options jsonb not null, -- Array of possible answers: [{"text": "A", "isCorrect": true}, ...]
  order_index integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

CREATE TABLE public.applicant_exams (
  id uuid default gen_random_uuid() primary key,
  applicant_id uuid references public.profiles(id) on delete cascade not null,
  exam_id uuid references public.exams(id) on delete cascade not null,
  score integer,
  status text default 'Assigned' check (status in ('Assigned', 'In Progress', 'Completed', 'Failed', 'Passed')),
  answers jsonb, -- Stores user provided answers
  completed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  UNIQUE(applicant_id, exam_id)
);

-- Exams RLS
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicant_exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage exams" ON public.exams FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Applicants can view active exams" ON public.exams FOR SELECT USING (active = true);

CREATE POLICY "Admins can manage exam questions" ON public.exam_questions FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Applicants can view questions of assigned exams" ON public.exam_questions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.applicant_exams WHERE applicant_id = auth.uid() AND exam_id = public.exam_questions.exam_id)
);

CREATE POLICY "Admins can view all applicant exams" ON public.applicant_exams FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can manage applicant exams" ON public.applicant_exams FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Applicants can view their own exams" ON public.applicant_exams FOR SELECT USING (applicant_id = auth.uid());
CREATE POLICY "Applicants can update their own exams" ON public.applicant_exams FOR UPDATE USING (applicant_id = auth.uid());

-- 9. Interviews Management
CREATE TABLE public.interviews (
  id uuid default gen_random_uuid() primary key,
  applicant_id uuid references public.profiles(id) on delete cascade not null,
  interviewer_id uuid references public.profiles(id) on delete set null,
  scheduled_at timestamp with time zone not null,
  meeting_link text,
  status text default 'Scheduled' check (status in ('Scheduled', 'Completed', 'Canceled', 'No Show')),
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all interviews" ON public.interviews FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Applicants can view their own interviews" ON public.interviews FOR SELECT USING (
  applicant_id = auth.uid()
);
