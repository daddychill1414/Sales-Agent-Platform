# Implementation Plan — Sales Agent Platform Upgrades

Applying all audit-identified upgrades (excluding Dark Mode #16, PWA #20, Pricing #12) and ensuring compliance with GEMINI.md and vibecodesecurity.md rulesets.

---

## Phase 1: Foundation & Design System Fixes

### [MODIFY] [globals.css](file:///c:/Users/ranie/.gemini/antigravity/scratch/sales-agent-platform/src/app/globals.css)
- Fix `.btn-primary` and `.btn-outline` hover to use `scale(1.03)` with `cubic-bezier(0.25, 0.46, 0.45, 0.94)`
- Add sliding `<span>` background layer technique via new `.btn-slide` utility
- Add `translateY(-1px)` hover lift on all `a` link elements
- Fix noise overlay opacity to `0.05` (currently `0.04`)

### [MODIFY] [layout.tsx](file:///c:/Users/ranie/.gemini/antigravity/scratch/sales-agent-platform/src/app/layout.tsx)
- Add JetBrains Mono font via `next/font/google`
- Wire `--font-mono` CSS variable

### [MODIFY] [Footer.tsx](file:///c:/Users/ranie/.gemini/antigravity/scratch/sales-agent-platform/src/components/Footer.tsx)
- Add `rounded-t-[4rem]` to footer container

### All interactive elements across pages
- Add unique [id](file:///c:/Users/ranie/.gemini/antigravity/scratch/sales-agent-platform/src/middleware.ts#4-7) attributes to all buttons, inputs, forms, and links

---

## Phase 2: Mobile & SEO

### [MODIFY] [Navbar.tsx](file:///c:/Users/ranie/.gemini/antigravity/scratch/sales-agent-platform/src/components/Navbar.tsx)
- Add hamburger icon for mobile (visible on `md:` breakpoint down)
- Build slide-out or dropdown mobile menu with links + CTA
- Add proper `aria-` attributes for accessibility

### Per-page SEO metadata (Next.js `metadata` exports)
- [MODIFY] [careers/page.tsx](file:///c:/Users/ranie/.gemini/antigravity/scratch/sales-agent-platform/src/app/careers/page.tsx) — add page-specific title + description
- [MODIFY] [news/page.tsx](file:///c:/Users/ranie/.gemini/antigravity/scratch/sales-agent-platform/src/app/news/page.tsx) — add page-specific title + description
- [MODIFY] [apply/page.tsx](file:///c:/Users/ranie/.gemini/antigravity/scratch/sales-agent-platform/src/app/apply/page.tsx) — add page-specific title + description
- [MODIFY] [login/page.tsx](file:///c:/Users/ranie/.gemini/antigravity/scratch/sales-agent-platform/src/app/login/page.tsx) — add page-specific title + description
- [MODIFY] [exam/page.tsx](file:///c:/Users/ranie/.gemini/antigravity/scratch/sales-agent-platform/src/app/exam/page.tsx) — add page-specific title + description

> [!NOTE]
> Next.js client components can't export `metadata`. Pages that are `"use client"` will need refactoring to either extract metadata into a separate layout or use `<Head>` via `next/head` or split the client logic into a child component.

---

## Phase 3: New Homepage Sections

### [NEW] [FeatureCards.tsx](file:///c:/Users/ranie/.gemini/antigravity/scratch/sales-agent-platform/src/components/FeatureCards.tsx)
Three interactive micro-UI cards:
1. **Diagnostic Shuffler** — 3 overlapping cards cycling vertically every 3s with spring-bounce
2. **Telemetry Typewriter** — monospace live-text feed with blinking cursor
3. **Cursor Protocol Scheduler** — animated weekly grid with SVG cursor interaction

### [NEW] [PhilosophySection.tsx](file:///c:/Users/ranie/.gemini/antigravity/scratch/sales-agent-platform/src/components/PhilosophySection.tsx)
- Full-width dark background section
- Parallaxing Unsplash texture image at low opacity
- Contrasting statements: "Most agencies focus on..." vs "We focus on..."
- Word-by-word fade-up reveal animation on scroll

### [NEW] [ProtocolCards.tsx](file:///c:/Users/ranie/.gemini/antigravity/scratch/sales-agent-platform/src/components/ProtocolCards.tsx)
- 3 full-height sticky stacking cards
- Each card scales down, blurs, and fades as the next scrolls in
- Unique SVG animations per card (rotating motif, scanning line, pulsing waveform)

### [MODIFY] [page.tsx](file:///c:/Users/ranie/.gemini/antigravity/scratch/sales-agent-platform/src/app/page.tsx)
- Replace static value prop cards with `<FeatureCards />`
- Insert `<PhilosophySection />` between Features and Metrics
- Insert `<ProtocolCards />` after Pipeline section

---

## Phase 4: Missing Pages & Error Handling

### [NEW] [not-found.tsx](file:///c:/Users/ranie/.gemini/antigravity/scratch/sales-agent-platform/src/app/not-found.tsx)
- Custom 404 page matching design system

### [NEW] [error.tsx](file:///c:/Users/ranie/.gemini/antigravity/scratch/sales-agent-platform/src/app/error.tsx)
- Custom error boundary matching design system

### [NEW] [dashboard/page.tsx](file:///c:/Users/ranie/.gemini/antigravity/scratch/sales-agent-platform/src/app/dashboard/page.tsx)
- Agent-facing dashboard with application status, exam info, progress tracker
- Uses Supabase to fetch logged-in user's profile data

### Loading states
- Add skeleton UI to admin dashboard stats and tables

---

## Phase 5: Security & Code Quality (vibecodesecurity.md)

### Input Validation
- Strengthen [ApplicationForm.tsx](file:///c:/Users/ranie/.gemini/antigravity/scratch/sales-agent-platform/src/components/ApplicationForm.tsx) validation (email regex, phone format, XSS prevention via sanitization)
- Add server-side validation in middleware where applicable

### Access Control
- Verify admin routes are protected via Supabase middleware
- Add role checking in admin layout

### Error Handling
- Wrap Supabase calls in try/catch  
- Show user-friendly error messages
- Add loading spinners to all async operations

### Code Quality
- Add JSDoc comments to key components
- Ensure consistent naming conventions
- Clean up unused imports

---

## Verification Plan

### Automated: Build Verification
```bash
cd c:\Users\ranie\.gemini\antigravity\scratch\sales-agent-platform
npm run build
```
This will catch TypeScript errors, import issues, and Next.js build failures.

### Visual: Browser Testing
- Start dev server with `npm run dev`
- Open browser and navigate through all pages
- Verify: mobile nav, interactive cards, philosophy section, protocol cards, 404 page, error page, dashboard, button animations
