# Database ↔ Website Gap Analysis

## Current Database Tables (Supabase)

| Table | Key Columns | Used by Admin? | Used by Applicant? |
|-------|------------|:-:|:-:|
| `profiles` | id, role, full_name, phone, stage, resume_url, work_experience, sales_background | ⚠️ Mock data only | ✅ Real queries |
| `news_articles` | id, title, content, author_id | ⚠️ Mock data only | ✅ Public news page |
| `exams` | id, title, description, active | ⚠️ Mock data only | ✅ Applicant exam page |
| `exam_questions` | id, exam_id, question_text, options, order_index | ⚠️ Mock data only | ✅ Applicant exam page |
| `applicant_exams` | applicant_id, exam_id, score, status, answers | ⚠️ Mock data only | ✅ Dashboard |
| `interviews` | applicant_id, interviewer_id, scheduled_at, meeting_link, status, notes | ⚠️ Mock data only | ✅ Dashboard |

> [!CAUTION]
> **Every admin page is 100% hardcoded mock data.** None of the admin pages (`/admin`, `/admin/applicants`, `/admin/exams`, `/admin/interviews`, `/admin/documents`, `/admin/knowledge`) query Supabase. This is the #1 priority issue.

---

## 🔴 Critical: Wire Up Existing Admin Pages to Real Data

These pages already have beautiful UI but show fake data:

| Admin Page | Needs to Query | Actions Needed |
|---|---|---|
| `/admin` (Dashboard) | `profiles`, `applicant_exams`, `interviews` | Replace hardcoded stats (248 apps, 84 passed, etc.) with real `COUNT(*)` queries. Recent applications should pull real profiles. |
| `/admin/applicants` | `profiles` | Replace `MOCK_APPLICANTS` with real Supabase query. Wire up search, filtering, stage advancement, and the slide-over panel. |
| `/admin/exams` | `exams`, `exam_questions`, `applicant_exams` | Replace `MOCK_EXAMS` with real data. Wire "Create Assessment" form to insert into `exams`. Wire question management. |
| `/admin/interviews` | `interviews`, `profiles` | Replace `MOCK_INTERVIEWS`. Wire "Schedule New" form to insert into `interviews`. |
| `/admin/documents` | `storage.objects` (resumes bucket) | Replace `MOCK_DOCS` with real storage listing. Wire download/delete. |
| `/admin/knowledge` | `news_articles` | Replace `MOCK_ARTICLES` with real data. Wire create/edit/delete. |

---

## 🟡 Missing Database Tables to Add

These tables don't exist yet but are needed for features the website already hints at or would greatly benefit from:

### 1. `notifications` — In-App Notifications
```sql
CREATE TABLE public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  message text,
  type text check (type in ('info','success','warning','action')),
  read boolean default false,
  link text,               -- optional deep link
  created_at timestamptz default now()
);
```
**Why:** Both admin and applicant dashboards need a notification bell. Applicants should be notified when their stage changes, exams are assigned, or interviews are scheduled.

### 2. `activity_log` — Admin Audit Trail
```sql
CREATE TABLE public.activity_log (
  id uuid default gen_random_uuid() primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,      -- 'stage_advanced', 'exam_assigned', 'interview_scheduled', etc.
  target_type text,          -- 'profile', 'exam', 'interview'
  target_id uuid,
  metadata jsonb,            -- additional context
  created_at timestamptz default now()
);
```
**Why:** The admin dashboard shows "Recent Activity" but it's fake. This table powers a real audit log of all admin actions.

### 3. `settings` — Admin App Settings
```sql
CREATE TABLE public.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);
```
**Why:** Store configurable values like passing exam score threshold, interview duration defaults, email templates, etc.

### 4. `documents` — General Admin Documents (beyond resumes)
```sql
CREATE TABLE public.documents (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  file_url text not null,
  file_type text,
  file_size bigint,
  owner_id uuid references public.profiles(id) on delete set null,
  category text check (category in ('contract','policy','template','other')),
  created_at timestamptz default now()
);
```
**Why:** The `/admin/documents` page shows contracts and commission structures alongside resumes, but there's no table for non-resume documents. The `resumes` storage bucket only handles applicant uploads.

### 5. `email_templates` — Automated Communications
```sql
CREATE TABLE public.email_templates (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  subject text not null,
  body text not null,
  trigger_event text,    -- 'exam_assigned', 'interview_scheduled', 'hired', etc.
  active boolean default true,
  created_at timestamptz default now()
);
```
**Why:** When admins advance stages, assign exams, or schedule interviews, automated emails should be sent. This table stores those templates.

---

## 🟢 Missing Website Features to Add

### For Applicants (`/dashboard`)
| Feature | DB Table(s) | Notes |
|---|---|---|
| **Notification bell** | `notifications` | Show unread count badge, dropdown list |
| **Edit profile** | `profiles` | Let applicants update phone, name, sales background |
| **Upload/replace resume** | `storage.objects` | Currently shows "Uploaded" but can't re-upload |
| **View exam results detail** | `applicant_exams`, `exam_questions` | Show which questions they got right/wrong |
| **Interview prep info** | `interviews` | Show meeting link, interviewer name, notes |

### For Admin (`/admin/*`)
| Feature | DB Table(s) | Notes |
|---|---|---|
| **Real-time stats on dashboard** | `profiles`, `applicant_exams` | Aggregate queries replacing hardcoded numbers |
| **Advance applicant stage** | `profiles` | The "Advance Stage" button exists but does nothing |
| **Assign exam to applicant** | `applicant_exams` | Button on applicant detail to assign an exam |
| **Add questions to exams** | `exam_questions` | The exam create modal only has title/description, no question editor |
| **Interview notes & scoring** | `interviews` | Post-interview feedback form |
| **Notification management** | `notifications` | Admin page to view/manage sent notifications |
| **Activity log feed** | `activity_log` | Real recent activity on admin dashboard |
| **Settings page** | `settings` | Configurable thresholds and defaults |
| **Bulk actions** | `profiles` | Select multiple applicants → advance, reject, export |
| **CSV/Excel export** | `profiles` | The "Export List" button exists but does nothing |

### Missing Public Pages
| Page | Notes |
|---|---|
| **Individual news article** (`/news/[id]`) | The news listing page exists but there's no detail page |
| **About / Company page** | Referenced in navigation but doesn't exist |
| **FAQ page** | Common for recruitment platforms |

---

## Summary: Priority Order

1. **🔴 Wire all admin pages to real Supabase data** — This is the biggest gap. Beautiful UI, zero real functionality.
2. **🟡 Add `notifications` and `activity_log` tables** — Powers the notification bell and real admin activity feed.
3. **🟢 Add missing admin functionality** — Stage advancement, exam assignment, question editor, interview notes.
4. **🟢 Applicant dashboard enhancements** — Profile editing, notification bell, exam results detail.
5. **🟡 Add `documents` and `email_templates` tables** — Powers document management beyond resumes and automated communications.
6. **🟢 Missing pages** — News article detail, About page, FAQ.
