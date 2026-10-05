# Phenomenon Labs - Sales Agent Recruitment Platform

This is a comprehensive Sales Agent Recruitment Platform built with Next.js 14, Tailwind CSS, GSAP, and Supabase.

## What is Working Right Now

The platform is fully scaffolded with a complete UI/UX mapped to the database schema. Here is the breakdown:

### 1. Public Agent Portal
- **Landing Page (`/`)**: A dynamic showcase of the agency with premium scroll animations, glassmorphism UI, and custom typography.
- **Application Flow (`/apply`)**: A robust multi-step wizard form to collect candidate details, employment history, and upload resumes.
- **Public Exam Interface (`/exam`)**: A distraction-free assessment module for candidates to take pre-employment tests and answer high-ticket sales scenario questions.
- **Portal Login (`/login`)**: Built-in Supabase authentication to secure the `admin` panel and protect routes.

### 2. Secure Admin Dashboard (`/admin`)
- **Dashboard Overview (`/admin`)**: Real-time KPI statistics (Total applications, hired agents, pending reviews).
- **Applicant Pipeline (`/admin/applicants`)**: Full applicant tracking Kanban/List hybrid view.
- **Exam Management (`/admin/exams`)**: A hub to create assessments and monitor test answers.
- **Interview Scheduling (`/admin/interviews`)**: A calendar feed to schedule and manage applicant interviews.
- **Document Vault (`/admin/documents`)**: Secure storage space for applicant resumes and HR documents.
- **HR Knowledge Base (`/admin/knowledge`)**: Content manager for training manuals and guidelines.

---

## How to Login to Admin

To access the `/admin` portal, you must be authenticated *and* have an `admin` role in the database. When you visit `/login`, the middleware will check your status.

**Follow these exact steps to create your Admin account:**

1. **Sign Up**: First, create a regular account. You can do this by submitting the application at `http://localhost:3000/apply` (you can use dummy data) OR by directly adding a user via your Supabase Dashboard -> Authentication -> Add User.
2. **Elevate Your Role in Supabase**:
   - Go to your Supabase Project Dashboard online.
   - Click on **Table Editor** on the left-hand menu.
   - Select the `profiles` table.
   - Find the row with your newly created user's email/id.
   - Double click on the `role` column cell for your user.
   - Change the value from `applicant` to `admin` and hit Save.
3. **Login & Access**:
   - Go back to your app at `http://localhost:3000/login`.
   - Sign in with your email and password.
   - You will automatically be redirected to the secure `http://localhost:3000/admin` dashboard and all the pages will be unlocked!

## Getting Started Locally

Install dependencies:
```bash
npm install
```

Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
