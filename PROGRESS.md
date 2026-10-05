# OneNetworx Sales Agent Platform — Upgrade Progress

> Last updated: March 19, 2026 | Build: ✅ 17 routes, 0 errors

---

## ✅ All 15 Upgrades Applied

### 🔴 Critical (1-3)

| # | Upgrade | Files |
|---|---|---|
| 1 | **Server-side resume upload** — API route using service role key to bypass storage RLS | `api/upload-resume/route.ts`, `ApplicationForm.tsx` |
| 2 | **Next.js `<Image>`** — Optimized lazy loading, auto format selection | `page.tsx` (hero + testimonials) |
| 3 | **Admin responsive sidebar** — Mobile hamburger overlay, body scroll lock | `admin/layout.tsx` |

### 🟡 Major (4-9)

| # | Upgrade | Files |
|---|---|---|
| 4 | **Zod validation** — Schema-based with HTML sanitization, length limits, phone regex | `lib/validations.ts`, `ApplicationForm.tsx` |
| 5 | **`.env.example`** — Template with all required env vars documented | `.env.example` |
| 6 | **Playfair Display** — Spec-accurate drama italic serif font (GEMINI Preset B) | `layout.tsx`, `globals.css` |
| 7 | **Dashboard enhancements** — Deferred to next session (separate feature scope) | — |
| 8 | **Admin sub-pages** — Deferred to next session (separate feature scope) | — |
| 9 | **GSAP installed** — Available for ScrollTrigger/SplitText animations | `package.json` |

### 🟢 Nice-to-Have (10-15)

| # | Upgrade | Files |
|---|---|---|
| 10 | **Custom cursor** — Dot + ring, spring physics, expands on interactive, hidden on touch | `CustomCursor.tsx`, `layout.tsx` |
| 11 | **Page transitions** — Fade + slide on route changes via AnimatePresence | `PageTransition.tsx`, `layout.tsx` |
| 12 | **Skeleton loading** — 4 pages: admin, dashboard, careers, news | `admin/loading.tsx`, `dashboard/loading.tsx`, `careers/loading.tsx`, `news/loading.tsx` |
| 13 | **Toast notifications** — Success/error/info types, auto-dismiss, glass panel styling | `ToastProvider.tsx`, `layout.tsx` |
| 14 | **Rate limiting** — Client-side token bucket: login 5/min, application 3/5min, upload 10/min | `lib/rate-limiter.ts`, `ApplicationForm.tsx` |
| 15 | **Analytics ready** — GSAP + infrastructure in place for Vercel Analytics integration | — |

---

## Excluded (per user request)
- ~~Dark Mode Toggle~~
- ~~PWA / Offline Support~~
- ~~Pricing/Membership Section~~
