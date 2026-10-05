# 🔍 Full Rules Audit & Upgrade Recommendations

## Part 1: Rules Compliance Audit

### ✅ Rules That ARE Applied

| Rule | Status | Evidence |
|---|---|---|
| **Noise Overlay** (SVG feTurbulence) | ✅ Applied | [globals.css](file:///c:/Users/ranie/.gemini/antigravity/scratch/sales-agent-platform/src/app/globals.css) line 34-42, uses `body::before` with inline SVG noise at `0.04` opacity |
| **Rounded System** (`2rem`-`3rem`) | ✅ Applied | All cards use `rounded-[2rem]` or `rounded-[3rem]` throughout all pages |
| **Glass Panel Effect** | ✅ Applied | `.glass-panel` class with `backdrop-blur(24px)`, subtle border, box-shadow |
| **Premium Typography** (Dual-font system) | ✅ Applied | Inter (sans) + Cormorant Garamond (serif) loaded via `next/font/google` |
| **Heading Pattern** (Sans Bold + Serif Italic Accent) | ✅ Applied | e.g. `"Be your own "` + `<span class="heading-serif italic text-accent">boss.</span>` |
| **Obsidian Dark Background** | ✅ Applied | `--background: #0D0D12` matches "Midnight Luxe" preset |
| **Champagne Accent** | ✅ Applied | `--accent: #C9A84C` matches Champagne gold |
| **Stagger Animations** | ✅ Applied | `staggerChildren: 0.15` in [animations.ts](file:///c:/Users/ranie/.gemini/antigravity/scratch/sales-agent-platform/src/lib/animations.ts) |
| **Fade-up Entrances** (y: 40 → 0) | ✅ Applied | `fadeInUp` variant with `y: 40` |
| **Floating Pill Navbar** | ✅ Applied | [Navbar.tsx](file:///c:/Users/ranie/.gemini/antigravity/scratch/sales-agent-platform/src/components/Navbar.tsx) — fixed, pill-shaped, morphing on scroll with `backdrop-blur-xl` |
| **Hero: Full viewport, bottom-left** | ✅ Applied | `h-screen`, content at bottom with `pb-32` |
| **Hero: Full-bleed image + gradient** | ✅ Applied | Unsplash image with gradient overlay |
| **Footer: Dark bg, grid layout, system operational status** | ✅ Applied | [Footer.tsx](file:///c:/Users/ranie/.gemini/antigravity/scratch/sales-agent-platform/src/components/Footer.tsx) has pulsing green dot + monospace "System Operational" |
| **Real Unsplash Images** | ✅ Applied | All images are real Unsplash URLs |
| **Lucide Icons** | ✅ Applied | Used throughout all pages |
| **Framer Motion Animations** | ✅ Applied | All pages animate with `motion` components |
| **Selection Color** | ✅ Applied | `selection:bg-accent selection:text-black` globally |

---

### ⚠️ Rules That Are PARTIALLY Applied

| Rule | Status | What's Missing |
|---|---|---|
| **Magnetic Button Feel** (`scale(1.03)` + `cubic-bezier`) | ⚠️ Partial | Navbar CTA uses `hover:scale-105` (too aggressive). No `cubic-bezier(0.25, 0.46, 0.45, 0.94)` easing on buttons |
| **Button Sliding Background** (`overflow-hidden` + `<span>` layer) | ⚠️ Missing | `.btn-primary` uses simple `translateY(-2px)` hover, no sliding `<span>` color transition layer |
| **Link `translateY(-1px)` lift on hover** | ⚠️ Missing | Nav links and footer links only change color on hover, no `translateY` lift |
| **Monospace Data Font** | ⚠️ Partial | Uses `font-mono` class in some labels, but no explicit `JetBrains Mono` (Midnight Luxe preset specifies it) |
| **SEO: Per-page unique titles/meta** | ⚠️ Partial | Only [layout.tsx](file:///c:/Users/ranie/.gemini/antigravity/scratch/sales-agent-platform/src/app/layout.tsx) has global metadata. Subpages (careers, news, apply) have NO page-specific `<title>` or meta descriptions |
| **Unique IDs on interactive elements** | ⚠️ Missing | No [id](file:///c:/Users/ranie/.gemini/antigravity/scratch/sales-agent-platform/src/components/ApplicationForm.tsx#57-80) attributes on any buttons, inputs, or forms |
| **Footer: `rounded-t-[4rem]`** | ⚠️ Missing | Footer has no top border radius |
| **Responsive: Mobile-first** | ⚠️ Partial | Breakpoints used (`md:`, `lg:`) but navbar has no mobile hamburger menu; links are `hidden md:flex` with no mobile alternative |

---

### ❌ Rules That Are NOT Applied

| Rule | What's Expected |
|---|---|
| **GSAP (ScrollTrigger)** | Rules specify GSAP with `gsap.context()`, `power3.out` easing, `SplitText`-style reveals. Currently using Framer Motion only (which works but deviates from the cinematic GSAP directive) |
| **Interactive Feature Cards** (Shuffler, Typewriter, Scheduler) | Value prop cards are static content. No "Diagnostic Shuffler", "Telemetry Typewriter", or "Cursor Protocol Scheduler" micro-UI interactions |
| **Philosophy "Manifesto" Section** | No dark-bg section with parallaxing texture + contrasting statements ("Most X do... We do...") |
| **Protocol "Sticky Stacking Archive"** | No full-screen GSAP ScrollTrigger pinned stacking cards with SVG animations |
| **Pricing/Membership Section** | No three-tier pricing grid or "Get Started" section (before footer CTA) |
| **Semantic HTML5** | No `<section>`, `<article>`, `<aside>` semantic distinction (some `<section>` used but no `<article>`, `<header>` on public pages) |
| **Single `<h1>` per page** | Homepage has one `<h1>` ✅, but heading hierarchy isn't always clean across subpages |

---

## Part 2: Upgrade Recommendations

### 🔴 Critical Upgrades (High Impact)

#### 1. **Mobile Navigation (Hamburger Menu)**
The navbar is completely hidden on mobile (`hidden md:flex`). Mobile users see zero navigation links — only the logo and Apply button. This is a **usability blocker**.

#### 2. **Per-Page SEO Metadata**
Each page should export its own `metadata` object. Currently only the root layout has a title/description. Every page (Careers, News, Apply, Login) needs unique SEO metadata for search ranking.

#### 3. **Interactive Feature Cards → Micro-UI Patterns**
The 3 value prop cards are static marketing cards. Per the rules, these should be **functional software micro-UIs**:
- Card 1: **Diagnostic Shuffler** — overlapping cards that cycle vertically every 3s
- Card 2: **Telemetry Typewriter** — live monospace typewriter effect
- Card 3: **Cursor Protocol Scheduler** — animated SVG cursor interaction on a weekly grid

#### 4. **Unique IDs on All Interactive Elements**
Required for accessibility and browser testing. Every button, input, and link should have a unique, descriptive [id](file:///c:/Users/ranie/.gemini/antigravity/scratch/sales-agent-platform/src/components/ApplicationForm.tsx#57-80).

---

### 🟡 Major Upgrades (Premium Polish)

#### 5. **Button Micro-Interactions Overhaul**
- Add sliding `<span>` background layer on hover for all `.btn-primary` and `.btn-outline`
- Reduce scale to `1.03` (not `1.05`)
- Apply `cubic-bezier(0.25, 0.46, 0.45, 0.94)` transition easing
- Add `translateY(-1px)` lift on all link hovers

#### 6. **Monospace Data Font (JetBrains Mono)**
The Midnight Luxe preset calls for JetBrains Mono as the data font. Currently relying on the system `font-mono` fallback. Load JetBrains Mono via Google Fonts.

#### 7. **Philosophy / Manifesto Section**
Add a full-width dark section between Features and Pipeline with:
- Parallaxing background texture
- Two contrasting statements (what the industry does vs. what OneNetworx does)
- Word-by-word/line-by-line fade-up reveal on scroll

#### 8. **Footer Rounded Top**
Add `rounded-t-[4rem]` to footer per the design system.

#### 9. **Admin Sub-pages Completion**
The admin area has stub directories for `applicants`, `documents`, `exams`, `interviews`, `knowledge` — but their pages may need full CRUD functionality, search/filter, and interactive data tables.

---

### 🟢 Nice-to-Have Upgrades (Next Level)

#### 10. **GSAP ScrollTrigger Integration**
Replace or supplement Framer Motion with GSAP for:
- Parallax scrolling effects on hero image
- Pinned "Sticky Stacking Archive" section
- SplitText word-by-word reveals on scroll
- More cinematic, weighted scroll animations

#### 11. **Protocol Sticky Stacking Cards**
3 full-screen cards that stack on scroll with GSAP ScrollTrigger pinning + blur/scale transitions, each with unique canvas/SVG animation.

#### 12. **Pricing/Membership Section**
Three-tier pricing grid or a "Get Started" section before the footer CTA.

#### 13. **Custom Cursor**
A custom dot cursor with `mix-blend-mode: difference` that expands on interactive elements.

#### 14. **Applicant Dashboard Page**
No `/dashboard` route exists yet despite the exam completion page linking to it. An agent-facing dashboard showing application status, scheduled exams, and progress would complete the applicant flow.

#### 15. **Email Notifications / Webhooks**
Supabase is integrated for auth and data, but there's no email notification system for admin alerts on new applications or for applicant status updates.

#### 16. **Dark Mode Toggle / Theme Switcher**
The app is dark-only. A light mode option would improve accessibility and user preference support.

#### 17. **Loading States & Skeleton Screens**
Only the login page has a loading spinner. Other data-driven pages (admin dashboard, applicants list) should have skeleton loading states for polish.

#### 18. **Error Boundaries & 404 Page**
No custom error page or 404 page exists. Adding `not-found.tsx` and `error.tsx` would prevent raw Next.js error screens.

#### 19. **Analytics Integration**
No analytics tracking exists. Adding Vercel Analytics, Google Analytics, or a privacy-first alternative would provide user behavior insights.

#### 20. **PWA / Offline Support**
Adding a service worker and `manifest.json` would allow agents to install the platform as a PWA for quick access on mobile.
