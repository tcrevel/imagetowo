# Implementation Plan: Workout Image to ZWO Converter

**Branch**: `001-workout-image-to-zwo` | **Date**: 2025-12-26 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `/specs/001-workout-image-to-zwo/spec.md`

## Summary

Build a Next.js web application that allows cyclists to upload workout images (photos or screenshots), parse them using OpenAI Vision API, edit the resulting structured workout, and export as a valid .zwo file for Zwift/Intervals.icu/TrainingPeaks.

The application follows a 3-step mobile-first flow: Upload → Edit/Review → Export, with full transparency on AI parsing confidence and warnings.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)  
**Primary Dependencies**: Next.js 14+ (App Router), Tailwind CSS, shadcn/ui, Zod, OpenAI SDK  
**Storage**: None (stateless - images processed in memory only)  
**Testing**: Vitest for unit tests, Playwright for E2E (optional MVP)  
**Target Platform**: Web (Vercel deployment), Mobile-first responsive  
**Project Type**: Web application (Next.js monolith)  
**Performance Goals**: Image parsing < 30s, Export generation < 1s  
**Constraints**: Max 10MB upload, 2000px max width, rate limit on /api/workouts/parse  
**Scale/Scope**: MVP single-user, no auth, no persistence

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Status |
|-----------|-------|--------|
| I. Security-First API Design | `OPENAI_API_KEY` in `.env.local` only, API routes server-side, no `NEXT_PUBLIC_*` for secrets | ✅ |
| II. Honest AI with Transparency | `warnings[]` + `confidence` in parse response, visible in UI, fallback to FreeRide | ✅ |
| III. Valid Export Guarantee | `workoutToZwo()` with unit tests, XML escaping, schema validation | ✅ |
| IV. Mobile-First UX | 375px viewport support, 3-step flow, camera capture | ✅ |
| V. Privacy by Default | No image persistence, rate limiting via middleware, requestId logging only | ✅ |

## Project Structure

### Documentation (this feature)

```
specs/001-workout-image-to-zwo/
├── plan.md              # This file
├── research.md          # Phase 0: Technology decisions
├── data-model.md        # Phase 1: Zod schemas and types
├── quickstart.md        # Phase 1: Dev setup guide
├── contracts/           # Phase 1: API specifications
│   ├── parse.md         # POST /api/workouts/parse
│   └── export.md        # POST /api/workouts/export/zwo
└── tasks.md             # Phase 2: Implementation tasks
```

### Source Code (Next.js App Router)

```
/
├── app/
│   ├── layout.tsx           # Root layout with fonts, metadata
│   ├── page.tsx             # Landing page (/)
│   ├── app/
│   │   └── page.tsx         # Main app page (/app)
│   └── api/
│       └── workouts/
│           ├── parse/
│           │   └── route.ts # POST /api/workouts/parse
│           └── export/
│               └── zwo/
│                   └── route.ts # POST /api/workouts/export/zwo
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── landing/             # Landing page sections
│   │   ├── hero.tsx
│   │   ├── how-it-works.tsx
│   │   ├── compatibility.tsx
│   │   ├── privacy.tsx
│   │   └── faq.tsx
│   └── workout/             # App components
│       ├── uploader.tsx     # Drag-drop + camera upload
│       ├── preview.tsx      # Image preview
│       ├── warnings.tsx     # Warnings display panel
│       ├── steps-editor.tsx # Editable steps table
│       └── export-button.tsx
├── lib/
│   ├── schemas/
│   │   └── workout.ts       # Zod schemas for Workout, Step, etc.
│   ├── services/
│   │   ├── openai.ts        # OpenAI Vision parsing logic
│   │   └── zwo-export.ts    # workoutToZwo() function
│   └── utils/
│       ├── image.ts         # Resize, validate images
│       └── rate-limit.ts    # Simple rate limiter
├── __tests__/
│   ├── unit/
│   │   ├── workout-schema.test.ts
│   │   └── zwo-export.test.ts
│   └── fixtures/
│       └── sample-workouts.ts
├── public/
│   └── images/              # Static assets
├── .env.example             # Environment template
├── .env.local               # Local secrets (gitignored)
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── vitest.config.ts
└── package.json
```

**Structure Decision**: Next.js App Router monolith with `/app` directory structure. All API logic in route handlers, shared code in `/lib`, components in `/components`. Tests colocated in `/__tests__/`.

## Milestones

### Milestone 1: Project Scaffold
- Initialize Next.js 14+ with App Router, TypeScript strict
- Install and configure Tailwind CSS + shadcn/ui
- Create landing page `/` skeleton with sections
- Create app page `/app` skeleton with 3-step flow placeholder
- Setup `.env.example` with `OPENAI_API_KEY`, `OPENAI_MODEL_VISION`, `MAX_UPLOAD_MB`, `IMAGE_MAX_WIDTH`
- Configure Vitest for testing

### Milestone 2: Parsing API
- Define Zod schemas: `Workout`, `Step` (all 5 types), `ParseResponse`
- Implement `POST /api/workouts/parse`:
  - Accept multipart/form-data with file, optional ftp/locale/unitsPreference/notes
  - Validate file size and type
  - Resize image if needed
  - Call OpenAI Vision API with structured prompt
  - Normalize response (minutes→seconds, "4x"→repeat, ranges→ramps)
  - Generate warnings for ambiguous content
  - Calculate confidence score
  - Return validated JSON or 422 with partial result
- Add rate limiting middleware
- Add request ID logging

### Milestone 3: Editor UI
- Build `Uploader` component (drag-drop, click, camera capture)
- Build `Preview` component (show uploaded image)
- Build `Warnings` panel (Alert components for each warning)
- Build `StepsEditor` table:
  - Display all step types with appropriate fields
  - Inline editing for duration, power, repeat count
  - Total duration computation
  - Reset to original parsed state
- Integrate 3-step flow: Upload → Review/Edit → Export
- Mobile-responsive layout (375px minimum)

### Milestone 4: Export ZWO
- Implement `workoutToZwo()` function:
  - Map step types to ZWO XML elements
  - Convert power % to decimal fractions
  - Escape XML special characters
  - Generate valid XML structure
- Write unit tests (minimum 10 sample workouts)
- Implement `POST /api/workouts/export/zwo`:
  - Accept workout JSON
  - Return XML with Content-Disposition attachment
- Add download button with slugified filename

### Milestone 5: Polish & QA
- Complete landing page content:
  - Hero with value proposition
  - How it works (3 steps illustrated)
  - Compatibility section (Zwift, Intervals.icu, TrainingPeaks)
  - Privacy statement
  - FAQ
  - CTA buttons
- Improve error messages and empty states
- Add loading states and progress indicators
- Mobile UX refinements
- Manual QA: import test in Zwift/Intervals.icu/TrainingPeaks
- Add example workout images (optional)

## Complexity Tracking

> No constitution violations. Complexity is minimal for MVP scope.

| Decision | Rationale |
|----------|-----------|
| No database | Stateless design per Privacy by Default principle |
| No auth | MVP scope - single anonymous user |
| Client-side state only | Workout lives in React state until export |
| Server-side export API | Could be client-side, but keeping API for consistency and potential future features |
