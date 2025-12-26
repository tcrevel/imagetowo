# Tasks: Workout Image to ZWO Converter

**Input**: Design documents from `/specs/001-workout-image-to-zwo/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅  
**Date**: 2025-12-26

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Next.js App Router**: `app/`, `components/`, `lib/`
- **API routes**: `app/api/workouts/`
- **Tests**: `__tests__/unit/`, `__tests__/fixtures/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Initialize Next.js 14+ project with App Router and TypeScript strict mode in `/`
- [ ] T002 Install and configure Tailwind CSS with `tailwind.config.ts`
- [ ] T003 [P] Initialize shadcn/ui with `components.json` and install Button, Card, Alert, Input, Table components in `components/ui/`
- [ ] T004 [P] Create `.env.example` with OPENAI_API_KEY, OPENAI_MODEL_VISION, MAX_UPLOAD_MB, IMAGE_MAX_WIDTH
- [ ] T005 [P] Add environment validation that fails fast if OPENAI_API_KEY missing in `lib/utils/env.ts`
- [ ] T006 [P] Configure Vitest with `vitest.config.ts` for unit testing
- [ ] T007 Create root layout with fonts and metadata in `app/layout.tsx`
- [ ] T008 [P] Create landing page skeleton in `app/page.tsx`
- [ ] T009 [P] Create app page skeleton with 3-step flow placeholder in `app/app/page.tsx`

**Checkpoint**: Project runs with `npm run dev`, both routes accessible

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T010 Define Zod schemas for all Step types (warmup, cooldown, steady, intervals, freeride) in `lib/schemas/workout.ts`
- [ ] T011 Define Zod schemas for Workout and ParseResponse in `lib/schemas/workout.ts`
- [ ] T012 [P] Create normalization helpers (minutes→seconds, pct parsing, repeat extraction) in `lib/utils/normalize.ts`
- [ ] T013 [P] Create image validation and resize utility in `lib/utils/image.ts`
- [ ] T014 [P] Create rate limiter utility (in-memory, per IP) in `lib/utils/rate-limit.ts`
- [ ] T015 [P] Create sample workout fixtures (10 canonical JSON examples) in `__tests__/fixtures/sample-workouts.ts`
- [ ] T016 Write unit tests for Zod schema validation in `__tests__/unit/workout-schema.test.ts`

**Checkpoint**: Foundation ready - all schemas validate, utilities tested

---

## Phase 3: User Story 1 - Upload and Parse Workout Image (Priority: P1) 🎯 MVP

**Goal**: User can upload a workout image and receive a parsed workout with warnings and confidence score

**Independent Test**: Upload an image, verify parsed workout structure matches with warnings/confidence displayed

### Implementation for User Story 1

- [ ] T017 [US1] Create OpenAI Vision service with structured prompt in `lib/services/openai.ts`
- [ ] T018 [US1] Implement multipart form handling for file upload in `app/api/workouts/parse/route.ts`
- [ ] T019 [US1] Add file type and size validation (400/413 errors) in `app/api/workouts/parse/route.ts`
- [ ] T020 [US1] Add rate limiting middleware check (429 error) in `app/api/workouts/parse/route.ts`
- [ ] T021 [US1] Implement image preprocessing (resize if > IMAGE_MAX_WIDTH) in `app/api/workouts/parse/route.ts`
- [ ] T022 [US1] Call OpenAI Vision API and normalize response in `app/api/workouts/parse/route.ts`
- [ ] T023 [US1] Validate AI output against Zod schema, return 200/422 appropriately in `app/api/workouts/parse/route.ts`
- [ ] T024 [US1] Add request ID generation and safe logging in `app/api/workouts/parse/route.ts`
- [ ] T025 [P] [US1] Create Uploader component (drag-drop, click, camera capture) in `components/workout/uploader.tsx`
- [ ] T026 [P] [US1] Create Preview component to display uploaded image in `components/workout/preview.tsx`
- [ ] T027 [US1] Create Warnings panel component using Alert in `components/workout/warnings.tsx`
- [ ] T028 [US1] Create confidence display badge component in `components/workout/confidence-badge.tsx`
- [ ] T029 [US1] Create basic steps display (read-only) in `components/workout/steps-display.tsx`
- [ ] T030 [US1] Integrate upload flow with API call and state management in `app/app/page.tsx`
- [ ] T031 [US1] Add loading states and error handling UI in `app/app/page.tsx`

**Checkpoint**: User Story 1 complete - upload → parse → display with warnings/confidence works

---

## Phase 4: User Story 2 - Edit Parsed Workout (Priority: P2)

**Goal**: User can edit any step's duration, power, or repeat count after parsing

**Independent Test**: Modify a step value, verify changes persist in workout state

### Implementation for User Story 2

- [ ] T032 [US2] Create StepsEditor table component with editable cells in `components/workout/steps-editor.tsx`
- [ ] T033 [US2] Implement duration editing (input with seconds conversion) in `components/workout/steps-editor.tsx`
- [ ] T034 [US2] Implement power percentage editing in `components/workout/steps-editor.tsx`
- [ ] T035 [US2] Implement repeat count editing for interval steps in `components/workout/steps-editor.tsx`
- [ ] T036 [US2] Add workout name editing field in `components/workout/workout-header.tsx`
- [ ] T037 [US2] Compute and display total workout duration in `components/workout/workout-header.tsx`
- [ ] T038 [US2] Add "Reset to original" button to restore parsed state in `components/workout/steps-editor.tsx`
- [ ] T039 [US2] Add warning dismissal functionality in `components/workout/warnings.tsx`
- [ ] T040 [US2] Integrate editor into app page, replacing read-only display in `app/app/page.tsx`

**Checkpoint**: User Story 2 complete - full editing capability with reset option

---

## Phase 5: User Story 3 - Export to ZWO File (Priority: P3)

**Goal**: User can download a valid .zwo file that imports into Zwift

**Independent Test**: Export a workout, verify XML is valid and imports into Zwift

### Tests for User Story 3 (Constitution Requirement: Principle III)

- [ ] T041 [P] [US3] Write unit tests for workoutToZwo() with 10 sample workouts in `__tests__/unit/zwo-export.test.ts`
- [ ] T042 [P] [US3] Test XML escaping for special characters (&, <, >, ", ') in `__tests__/unit/zwo-export.test.ts`

### Implementation for User Story 3

- [ ] T043 [US3] Implement workoutToZwo() function with XML generation in `lib/services/zwo-export.ts`
- [ ] T044 [US3] Implement XML character escaping utility in `lib/services/zwo-export.ts`
- [ ] T045 [US3] Map all step types to ZWO XML elements (Warmup, Cooldown, SteadyState, IntervalsT, FreeRide) in `lib/services/zwo-export.ts`
- [ ] T046 [US3] Implement POST endpoint returning XML with Content-Disposition in `app/api/workouts/export/zwo/route.ts`
- [ ] T047 [US3] Create filename slugifier utility in `lib/utils/slug.ts`
- [ ] T048 [US3] Create ExportButton component with download trigger in `components/workout/export-button.tsx`
- [ ] T049 [US3] Integrate export button into app page in `app/app/page.tsx`

**Checkpoint**: User Story 3 complete - export downloads valid .zwo file

---

## Phase 6: User Story 4 - Landing Page Discovery (Priority: P4)

**Goal**: Visitors understand the product value, compatibility, and privacy commitment

**Independent Test**: Navigate landing page, find value prop, compatibility list, and privacy info

### Implementation for User Story 4

- [ ] T050 [P] [US4] Create Hero component with value proposition and CTA in `components/landing/hero.tsx`
- [ ] T051 [P] [US4] Create HowItWorks component showing 3-step flow in `components/landing/how-it-works.tsx`
- [ ] T052 [P] [US4] Create Compatibility component listing Zwift, Intervals.icu, TrainingPeaks in `components/landing/compatibility.tsx`
- [ ] T053 [P] [US4] Create Privacy component with image handling statement in `components/landing/privacy.tsx`
- [ ] T054 [P] [US4] Create FAQ component with common questions in `components/landing/faq.tsx`
- [ ] T055 [P] [US4] Create Footer component in `components/landing/footer.tsx`
- [ ] T056 [US4] Assemble landing page with all sections in `app/page.tsx`
- [ ] T057 [US4] Add SEO meta tags and Open Graph in `app/page.tsx`
- [ ] T058 [US4] Ensure mobile-responsive layout (375px viewport) in `app/page.tsx`

**Checkpoint**: User Story 4 complete - landing page ready with all sections

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements affecting multiple user stories

- [ ] T059 [P] Improve error messages with user-friendly copy throughout the app
- [ ] T060 [P] Add empty states for upload area and editor in `app/app/page.tsx`
- [ ] T061 [P] Add analytics event hooks (optional, for future) in `lib/utils/analytics.ts`
- [ ] T062 Review mobile UX on 375px viewport for all pages
- [ ] T063 [P] Add example workout images in `public/images/examples/` (optional)
- [ ] T064 Manual QA: verify import in Zwift
- [ ] T065 Manual QA: verify import in Intervals.icu
- [ ] T066 Manual QA: verify import in TrainingPeaks

**Checkpoint**: All polish complete, QA passed

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup) ──────────────────────────────────────────────────────────►
                    │
                    ▼
Phase 2 (Foundational) ───────────────────────────────────────────────────►
                    │
        ┌───────────┼───────────┬───────────┐
        ▼           ▼           ▼           ▼
    Phase 3     Phase 4     Phase 5     Phase 6
     (US1)       (US2)       (US3)       (US4)
        │           │           │           │
        └───────────┴───────────┴───────────┘
                    │
                    ▼
            Phase 7 (Polish)
```

### User Story Dependencies

- **US1 (Parse)**: Depends on Phase 2 only - can start immediately after Foundational
- **US2 (Edit)**: Depends on US1 (needs parsed workout to edit)
- **US3 (Export)**: Can start after Phase 2, integrates with US1/US2 outputs
- **US4 (Landing)**: No dependencies on other stories - can run in parallel with US1-US3

### Critical Path

```
T001 → T007 → T010 → T017 → T030 → T032 → T040 → T041 → T049 → T064
```

---

## Parallel Opportunities

### Phase 1: Setup (5 parallel tasks)

```bash
# Can run simultaneously:
T003: shadcn/ui setup
T004: .env.example
T005: env validation
T006: Vitest config
T008 + T009: Page skeletons
```

### Phase 2: Foundational (4 parallel tasks)

```bash
# Can run simultaneously after T010-T011:
T012: Normalization helpers
T013: Image utils
T014: Rate limiter
T015: Fixtures
```

### Phase 3: User Story 1 (2 parallel groups)

```bash
# API tasks (sequential):
T017 → T018 → T019-T024

# UI tasks (parallel after T025):
T025: Uploader
T026: Preview
T027: Warnings
T028: Confidence badge
T029: Steps display
```

### Phase 6: User Story 4 (6 parallel tasks)

```bash
# All landing components can be built in parallel:
T050: Hero
T051: HowItWorks
T052: Compatibility
T053: Privacy
T054: FAQ
T055: Footer
```

---

## Implementation Strategy

### MVP First (User Story 1 + 3 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1 (Parse) 
4. Complete Phase 5: User Story 3 (Export) - tests + implementation
5. **STOP and VALIDATE**: Test full upload → export flow
6. Deploy minimal MVP

### Incremental Delivery

| Milestone | Stories | Value Delivered |
|-----------|---------|-----------------|
| M1 | US1 | Upload and parse - core value |
| M2 | US1 + US3 | Full flow - export capability |
| M3 | US1 + US2 + US3 | Editing - polished experience |
| M4 | All | Landing page - ready for launch |

### Parallel Team Strategy

With 2 developers:
1. Both complete Setup + Foundational
2. Dev A: US1 (Parse API + UI)
3. Dev B: US4 (Landing) → then US3 (Export)
4. Rejoin for US2 (Edit) and Polish

---

## Progress Tracking

| Phase | Total | Done | Progress |
|-------|-------|------|----------|
| Phase 1: Setup | 9 | 0 | 0% |
| Phase 2: Foundational | 7 | 0 | 0% |
| Phase 3: US1 Parse | 15 | 0 | 0% |
| Phase 4: US2 Edit | 9 | 0 | 0% |
| Phase 5: US3 Export | 9 | 0 | 0% |
| Phase 6: US4 Landing | 9 | 0 | 0% |
| Phase 7: Polish | 8 | 0 | 0% |
| **Total** | **66** | **0** | **0%** |

---

## Notes

- All tasks include exact file paths for immediate execution
- Constitution Principle III requires tests for ZWO export (T041-T042)
- US4 (Landing) can run entirely in parallel with US1-US3
- Manual QA (T064-T066) requires actual platform imports
- [P] tasks can run in parallel within their phase
- Each phase has a checkpoint to validate completeness
