# Feature Specification: Workout Image to ZWO Converter

**Feature Branch**: `001-workout-image-to-zwo`  
**Created**: 2025-12-26  
**Status**: Draft  
**Input**: ImageToFit MVP — Web app transforming cycling workout images into importable .zwo files

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Upload and Parse Workout Image (Priority: P1)

A cyclist has a photo of a workout (from a coach, a magazine, or a screenshot from an app). They want to quickly digitize it into a structured workout file they can import into Zwift.

The user opens the app, uploads or takes a photo of their workout, and receives a parsed workout with clear indication of what was understood and what needs attention.

**Why this priority**: This is the core value proposition — without image parsing, the app has no purpose. This story alone delivers MVP value.

**Independent Test**: User can upload a workout image, see the parsed result with warnings and confidence level, and verify the workout structure matches the original image.

**Acceptance Scenarios**:

1. **Given** a user on the `/app` page with a clear workout image, **When** they upload the image, **Then** they see a parsed workout with steps, a confidence score, and any warnings within 30 seconds.

2. **Given** a user uploading a blurry or partially illegible workout image, **When** the parsing completes, **Then** ambiguous segments show warnings and fallback to FreeRide steps, with confidence score below 0.7.

3. **Given** a user uploading an image exceeding size limits, **When** they attempt upload, **Then** they receive a clear error message about file size constraints.

4. **Given** a user on mobile taking a photo with device camera, **When** they capture and submit the photo, **Then** the image is processed identically to an uploaded file.

---

### User Story 2 - Edit Parsed Workout (Priority: P2)

After parsing, the user wants to correct any mistakes the AI made or adjust values (durations, power percentages, repetitions) before export.

The user reviews the parsed workout, sees clearly marked warnings, and can edit each step's parameters directly in the interface.

**Why this priority**: AI parsing will never be 100% accurate. Editing capability transforms a partially-correct result into a usable workout, dramatically increasing success rate.

**Independent Test**: User can modify any step's duration, power percentage, or repetition count, and changes persist for export.

**Acceptance Scenarios**:

1. **Given** a parsed workout with editable steps, **When** the user changes a step's duration from 300s to 600s, **Then** the updated value is reflected immediately and preserved.

2. **Given** a parsed workout with a warning on step 3, **When** the user modifies that step's power value, **Then** the warning can be dismissed and the step is marked as user-corrected.

3. **Given** an interval block with repeat count, **When** the user changes the repeat count from 4 to 6, **Then** the workout structure updates accordingly.

4. **Given** a parsed workout, **When** the user edits the workout name, **Then** the new name appears in the exported file.

---

### User Story 3 - Export to ZWO File (Priority: P3)

After reviewing and optionally editing the workout, the user wants to download a .zwo file they can import into Zwift, Intervals.icu, or TrainingPeaks.

The user clicks export and receives a valid .zwo XML file that imports correctly into target platforms.

**Why this priority**: Export is the final delivery of value. Without it, all previous work has no tangible output. However, it depends on P1 and P2 being functional.

**Independent Test**: User can download a .zwo file that successfully imports into Zwift without errors.

**Acceptance Scenarios**:

1. **Given** a complete parsed workout (with or without edits), **When** the user clicks Export, **Then** a .zwo file downloads with the workout name as filename.

2. **Given** a workout with special characters in name/description, **When** exported, **Then** the .zwo file contains properly escaped XML and imports without errors.

3. **Given** a workout with intervals, warmup, cooldown, and steady segments, **When** exported, **Then** all segment types are correctly represented in ZWO format.

---

### User Story 4 - Landing Page Discovery (Priority: P4)

A potential user discovers the app and wants to understand what it does, how it works, and whether it's safe to use before trying it.

The user lands on the homepage and finds clear explanations, compatibility information, and privacy assurances.

**Why this priority**: While not part of core functionality, the landing page is essential for user acquisition and trust. Can be built in parallel with other stories.

**Independent Test**: User can understand the product value, see compatible platforms, and find privacy information without using the app.

**Acceptance Scenarios**:

1. **Given** a new visitor on `/`, **When** they view the page, **Then** they see a hero section explaining the value proposition in under 5 seconds of reading.

2. **Given** a visitor wanting to know compatibility, **When** they scroll or navigate, **Then** they see Zwift, Intervals.icu, and TrainingPeaks listed as supported platforms.

3. **Given** a privacy-conscious visitor, **When** they look for privacy information, **Then** they find clear statement that images are not stored after processing.

4. **Given** a visitor ready to try the app, **When** they look for next steps, **Then** they find a clear CTA button leading to `/app`.

---

### Edge Cases

- **Corrupt or non-image file**: System rejects with clear error message, no processing attempted
- **Empty/blank image**: System returns warning indicating no workout detected, offers to retry
- **Very long workout (>3 hours)**: System handles gracefully, may show performance warning
- **Image with multiple workouts**: System parses primary/most visible workout, warns about additional content
- **Non-Latin characters in workout text**: System attempts parsing, handles Unicode in export
- **Network timeout during AI processing**: User sees timeout error with retry option
- **Rate limit exceeded**: User sees friendly message to wait before retrying

## Requirements *(mandatory)*

### Functional Requirements

#### Upload & Parsing

- **FR-001**: System MUST accept image uploads via file picker (drag-and-drop and click-to-select)
- **FR-002**: System MUST accept images captured directly from device camera on mobile
- **FR-003**: System MUST enforce maximum file size limit (configurable, default 10MB)
- **FR-004**: System MUST resize images exceeding maximum dimensions before processing (configurable, default 2000px width)
- **FR-005**: System MUST process images server-side only, never exposing AI credentials to client
- **FR-006**: System MUST return structured workout data within 30 seconds of upload
- **FR-007**: System MUST include confidence score (0-1) with every parsing result
- **FR-008**: System MUST generate warning messages for any ambiguous or illegible content
- **FR-009**: System MUST apply fallback (FreeRide segment) for unreadable portions instead of guessing

#### Workout Data Model

- **FR-010**: System MUST support these workout step types: warmup, cooldown, steady, intervals, freeride
- **FR-011**: System MUST store power values as percentage of FTP (0-200% typical range)
- **FR-012**: System MUST store durations in seconds
- **FR-013**: System MUST support ramp segments (warmup/cooldown with start and end power)
- **FR-014**: System MUST support interval blocks with repeat count, on-duration, off-duration, on-power, off-power
- **FR-015**: System MUST validate workout structure against defined schema before any operation

#### Editing

- **FR-016**: Users MUST be able to edit workout name
- **FR-017**: Users MUST be able to edit individual step durations
- **FR-018**: Users MUST be able to edit power percentages for any step
- **FR-019**: Users MUST be able to edit repeat counts for interval blocks
- **FR-020**: System MUST display warnings prominently and allow dismissal after user review

#### Export

- **FR-021**: System MUST generate valid XML conforming to ZWO schema
- **FR-022**: System MUST properly escape special characters in all XML attributes and text content
- **FR-023**: System MUST map step types to correct ZWO elements (Warmup, Cooldown, SteadyState, IntervalsT, FreeRide)
- **FR-024**: System MUST express power values as decimal fractions of FTP (75% → 0.75)
- **FR-025**: Exported file MUST import successfully into Zwift without modification

#### Privacy & Security

- **FR-026**: System MUST NOT persist uploaded images beyond the processing request lifecycle
- **FR-027**: System MUST enforce rate limiting on the parsing endpoint
- **FR-028**: System MUST log requests with unique ID for debugging without storing sensitive data
- **FR-029**: All AI API calls MUST occur server-side via API routes

#### Landing Page

- **FR-030**: Landing page MUST include hero section with value proposition
- **FR-031**: Landing page MUST include "How it works" explanation (3-step flow)
- **FR-032**: Landing page MUST list compatible platforms (Zwift, Intervals.icu, TrainingPeaks)
- **FR-033**: Landing page MUST include privacy statement about image handling
- **FR-034**: Landing page MUST include FAQ section addressing common questions
- **FR-035**: Landing page MUST include prominent CTA to `/app`

### Constitution Compliance Checklist

| Principle | How this feature complies |
|-----------|---------------------------|
| I. Security-First API Design | FR-005, FR-029: All AI calls server-side only. OPENAI_API_KEY never exposed to client. |
| II. Honest AI with Transparency | FR-007, FR-008, FR-009, FR-020: Confidence scores, warnings for ambiguity, fallback instead of guessing, visible warnings in UI. |
| III. Valid Export Guarantee | FR-021, FR-022, FR-025: Valid XML, proper escaping, Zwift-compatible output. Unit tests required. |
| IV. Mobile-First UX | FR-001, FR-002: Camera capture support. 3-step flow. UI must work on 375px viewport. |
| V. Privacy by Default | FR-026, FR-027, FR-028: No image persistence, rate limiting, safe logging. |

### Key Entities

- **Workout**: Represents a complete cycling training session with name, optional description, and ordered list of steps. Has associated warnings and confidence score from parsing.

- **Step**: A single segment of the workout. Can be one of five types:
  - *Warmup*: Gradual power ramp from low to target, has start/end power and duration
  - *Cooldown*: Gradual power ramp from target to low, has start/end power and duration
  - *Steady*: Constant power for duration, has single power value and duration
  - *Intervals*: Repeated on/off blocks, has repeat count, on-power, off-power, on-duration, off-duration
  - *FreeRide*: Unstructured segment with only duration (used as fallback for ambiguous content)

- **Warning**: A message indicating ambiguity or potential error in parsing, associated with specific step or overall workout

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete the full flow (upload → review → export) in under 2 minutes for a typical workout
- **SC-002**: 90% of exported .zwo files import successfully into Zwift on first attempt
- **SC-003**: System provides confidence score and warnings for 100% of parsed workouts
- **SC-004**: Users can identify and correct parsing errors using the edit interface without external help
- **SC-005**: Landing page communicates value proposition within 10 seconds of first visit
- **SC-006**: App page is fully usable on mobile devices (375px viewport minimum)
- **SC-007**: Image processing completes within 30 seconds for 95% of uploads
- **SC-008**: No user-uploaded images are retained after the browser session ends

## Assumptions

- Users have basic understanding of cycling workouts and FTP-based training
- Users have access to a device with camera (mobile) or file system (desktop)
- Target platforms (Zwift, etc.) maintain backward compatibility with current ZWO schema
- OpenAI Vision API provides sufficient accuracy for typical workout image formats
- Users accept English-language interface for MVP (localization is future scope)

## Out of Scope (MVP)

- User accounts or authentication
- Workout history or saving parsed workouts
- Direct integration with Zwift/Intervals.icu/TrainingPeaks APIs
- Batch processing of multiple images
- Workout templates or library
- Social sharing features
- Multi-language support
- Offline functionality
