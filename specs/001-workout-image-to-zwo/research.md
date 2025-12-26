# Research: Workout Image to ZWO Converter

**Feature**: 001-workout-image-to-zwo  
**Date**: 2025-12-26

## Technology Decisions

### 1. Next.js App Router vs Pages Router

**Decision**: App Router (Next.js 14+)

**Rationale**:
- Server Components reduce client bundle size
- Route handlers (`route.ts`) simplify API creation
- Built-in support for streaming (useful for long AI calls)
- Modern React patterns (Server Actions possible for future)
- Better TypeScript integration

**Alternatives Considered**:
- Pages Router: More documentation, but older pattern
- Separate backend (Express): Unnecessary complexity for MVP

---

### 2. OpenAI Vision Model Selection

**Decision**: `gpt-4o` (default) with `OPENAI_MODEL_VISION` env override

**Rationale**:
- GPT-4o has excellent vision capabilities for structured extraction
- Supports JSON mode for reliable parsing
- Cost-effective compared to GPT-4-turbo
- Environment variable allows switching without code change

**Alternatives Considered**:
- GPT-4-turbo-vision: Higher cost, minimal accuracy improvement for this use case
- Claude 3: Would require different SDK, lock-in concern
- Local models: Insufficient accuracy for production

---

### 3. UI Component Library

**Decision**: shadcn/ui + Tailwind CSS

**Rationale**:
- Copy-paste components (no runtime dependency)
- Fully customizable, accessible by default
- Perfect for mobile-first design
- Works seamlessly with Tailwind
- Active community, well-documented

**Alternatives Considered**:
- Radix UI only: More work to style
- Material UI: Heavier, less customizable
- Chakra UI: Good but larger bundle

---

### 4. Form/Schema Validation

**Decision**: Zod

**Rationale**:
- TypeScript-first with type inference
- Works both client and server side
- Great error messages
- Standard in Next.js ecosystem
- Supports complex schemas (discriminated unions for step types)

**Alternatives Considered**:
- Yup: Less TypeScript integration
- io-ts: Steeper learning curve
- Valibot: Newer, less ecosystem support

---

### 5. Rate Limiting Strategy

**Decision**: Simple in-memory rate limiter per IP

**Rationale**:
- No external dependencies for MVP
- Sufficient for single-instance deployment
- Easy to upgrade to Redis/Upstash later
- Constitution requires it, but doesn't mandate specific implementation

**Alternatives Considered**:
- Upstash Rate Limit: Better for distributed, but adds complexity
- Vercel Edge Config: Overkill for MVP
- No rate limiting: Violates Constitution Principle V

---

### 6. Image Processing

**Decision**: Client-side resize before upload + server validation

**Rationale**:
- Reduces upload time and bandwidth
- Browser Canvas API is sufficient for resize
- Server validates dimensions and size as safety net
- No need for sharp/jimp server-side for MVP

**Alternatives Considered**:
- Server-side only: Slower uploads, more bandwidth
- Third-party service (Cloudinary): Adds dependency and cost

---

### 7. ZWO XML Generation

**Decision**: String template with manual escaping

**Rationale**:
- ZWO format is simple and well-defined
- No need for full XML library
- Easier to test and debug
- Constitution requires valid XML - unit tests ensure this

**Alternatives Considered**:
- xml2js: Overhead for simple structure
- fast-xml-parser: Good but unnecessary complexity
- DOMParser: Browser-only, we may need server-side

---

### 8. Testing Framework

**Decision**: Vitest

**Rationale**:
- Fast, Vite-based (works great with Next.js)
- Jest-compatible API
- Better ESM support
- Built-in TypeScript support

**Alternatives Considered**:
- Jest: Slower, more configuration needed
- Playwright (E2E only): Good for E2E but not unit tests

---

## ZWO Format Reference

### Supported Elements (MVP)

| Step Type | ZWO Element | Attributes |
|-----------|-------------|------------|
| Warmup | `<Warmup>` | Duration, PowerLow, PowerHigh |
| Cooldown | `<Cooldown>` | Duration, PowerLow, PowerHigh |
| Steady | `<SteadyState>` | Duration, Power |
| Intervals | `<IntervalsT>` | Repeat, OnDuration, OffDuration, OnPower, OffPower |
| FreeRide | `<FreeRide>` | Duration |

### Sample ZWO Structure

```xml
<?xml version="1.0" encoding="UTF-8"?>
<workout_file>
  <author>ImageToFit</author>
  <name>Morning Intervals</name>
  <description>Parsed from image</description>
  <sportType>bike</sportType>
  <workout>
    <Warmup Duration="600" PowerLow="0.50" PowerHigh="0.75"/>
    <SteadyState Duration="300" Power="0.85"/>
    <IntervalsT Repeat="5" OnDuration="60" OffDuration="60" OnPower="1.20" OffPower="0.50"/>
    <Cooldown Duration="300" PowerLow="0.65" PowerHigh="0.40"/>
  </workout>
</workout_file>
```

### Power Value Convention

- ZWO uses decimal fractions: `0.75` = 75% FTP
- Our schema stores as percentage integers: `75` = 75% FTP
- Conversion: `zwoValue = schemaValue / 100`

---

## OpenAI Prompt Strategy

### Approach: Structured JSON Output

Request JSON mode with explicit schema in the prompt:

```
You are parsing a cycling workout image. Extract the workout structure as JSON.

Output schema:
{
  "name": "string - workout name if visible",
  "description": "string - any description text",
  "steps": [
    { "type": "warmup", "duration_s": number, "power_start_pct": number, "power_end_pct": number },
    { "type": "steady", "duration_s": number, "power_pct": number },
    { "type": "intervals", "repeat": number, "on_duration_s": number, "off_duration_s": number, "on_power_pct": number, "off_power_pct": number },
    { "type": "cooldown", "duration_s": number, "power_start_pct": number, "power_end_pct": number },
    { "type": "freeride", "duration_s": number }
  ],
  "warnings": ["string - any ambiguous or unclear parts"],
  "confidence": number // 0.0 to 1.0
}

Rules:
- If duration shown in minutes, convert to seconds
- If power shown as watts and FTP provided, convert to percentage
- If "4x30s" pattern, create intervals with repeat=4
- If text is illegible, add warning and use freeride as fallback
- Set confidence based on image clarity (1.0 = perfect, 0.5 = partially unclear)
```

### Normalization Rules (Post-Processing)

1. **Duration**: `"5 min"` → 300, `"1:30"` → 90, `"45s"` → 45
2. **Intervals**: `"4x30s/30s"` → repeat=4, on=30, off=30
3. **Power ranges**: `"50-75%"` → warmup with start=50, end=75
4. **Missing data**: Default to FreeRide with estimated duration

---

## Risk Mitigations

| Risk | Mitigation |
|------|------------|
| AI parsing inaccuracy | Warnings + confidence + fallback to FreeRide |
| Large images timeout | Client-side resize before upload |
| Rate limit abuse | In-memory rate limiter + clear error messages |
| Invalid XML export | Comprehensive unit tests with real ZWO imports |
| Mobile UX issues | Mobile-first design, test on 375px throughout |
