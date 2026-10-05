# Next Session: Platform Finalization & Admin Tooling

This document outlines the roadmap for the **Phase 6** upgrades to the OneNetworx Recruitment Platform. Now that the core applicant lifecycle and agent portals are complete, the focus shifts to internal team management, data security, and platform content control.

---

## 👥 1. Team Management & Role Administration
**The Problem:** Currently, making someone an `hr_admin` or `screener` requires manual database manipulation in Supabase.
**The Goal:** Build a secure interface for the `super_admin` to manage the internal team.

**Action Items:**
- [ ] Build `/admin/team` dashboard.
- [ ] Create API route to list all users with `super_admin`, `hr_admin`, and `screener` roles.
- [ ] Create a "Role Change" dropdown to elevate an applicant/agent to staff, or demote staff back to standard users.
- [ ] Implement "Invite Staff Member" functionality to send secure email invitations directly to new HR personnel.
- [ ] Log all role changes in the `audit_log`.

---

## 🔐 2. Security, Privacy & Auth Flows
**The Problem:** Resume PDFs are currently public, and users who forget their passwords have no way to recover their accounts.
**The Goal:** Lock down PII (Personally Identifiable Information) and finalize auth edges.

**Action Items:**
- [ ] Build `/forgot-password` and `/reset-password` pages.
- [ ] Transition the `resumes` Supabase storage bucket from "Public" to "Private".
- [ ] Update `/api/upload-resume` to use private bucket paths.
- [ ] Create a secure, authenticated `/api/admin/resume?id=XYZ` route that generates short-lived **Signed URLs** so admins can view candidate resumes securely.

---

## 📄 3. Content Management System (CMS)
**The Problem:** The homepage hero text, core philosophy, and legal pages (Privacy Policy, Terms of Service) are hardcoded into the React components. Non-technical founders cannot update the website copy.
**The Goal:** Make the public-facing platform dynamically managed by `super_admin`.

**Action Items:**
- [ ] Create a new `platform_settings` table in Supabase.
- [ ] Build `/admin/settings` UI featuring web editors for the Hero title, subheading, and mission statement.
- [ ] Add Rich Text Editors (or markdown editors) for the Privacy Policy and Terms of Service pages.
- [ ] Update the public frontend code to fetch and display this data instead of hardcoded strings.

---

## 🧠 4. Advanced Exam & Auto-Grader Features
**The Problem:** The exam auto-grader only handles exact multiple-choice matching. If an applicant disconnects, they lose all typing progress.
**The Goal:** Improve candidate experience and expand testing capabilities.

**Action Items:**
- [ ] Implement real-time draft saving (Debounced API saves to database as candidates type their answers).
- [ ] Add an "Awaiting Grading" tab for admins to manually score open-ended essay questions.

---

## 📊 5. Data Export & Polling
**The Problem:** Admins cannot export lists of qualified candidates, and the dashboard requires a hard refresh to see new numbers.

**Action Items:**
- [ ] Add **"Export to CSV"** functionality on the Pipeline and Applicants pages.
- [ ] Implement Supabase Realtime Channels on the Admin Dashboard so the unread application counts and stat cards animate as soon as a new candidate applies.
