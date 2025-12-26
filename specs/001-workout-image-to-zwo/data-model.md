# Data Model: Workout Image to ZWO Converter

**Feature**: 001-workout-image-to-zwo  
**Date**: 2025-12-26

## Overview

This document defines the canonical data structures used throughout the application. All schemas are defined using Zod for runtime validation and TypeScript type inference.

## Core Entities

### Step Types (Discriminated Union)

The workout consists of an ordered array of steps. Each step has a `type` discriminator that determines its shape.

#### WarmupStep

Gradual power increase from low to high over duration.

| Field | Type | Description |
|-------|------|-------------|
| type | `"warmup"` | Discriminator |
| duration_s | `number` | Duration in seconds (> 0) |
| power_start_pct | `number` | Starting power as % FTP (0-200) |
| power_end_pct | `number` | Ending power as % FTP (0-200) |

#### CooldownStep

Gradual power decrease from high to low over duration.

| Field | Type | Description |
|-------|------|-------------|
| type | `"cooldown"` | Discriminator |
| duration_s | `number` | Duration in seconds (> 0) |
| power_start_pct | `number` | Starting power as % FTP (0-200) |
| power_end_pct | `number` | Ending power as % FTP (0-200) |

#### SteadyStep

Constant power for a fixed duration.

| Field | Type | Description |
|-------|------|-------------|
| type | `"steady"` | Discriminator |
| duration_s | `number` | Duration in seconds (> 0) |
| power_pct | `number` | Target power as % FTP (0-200) |

#### IntervalsStep

Repeated on/off blocks.

| Field | Type | Description |
|-------|------|-------------|
| type | `"intervals"` | Discriminator |
| repeat | `number` | Number of repetitions (≥ 1) |
| on_duration_s | `number` | "On" interval duration in seconds (> 0) |
| off_duration_s | `number` | "Off" recovery duration in seconds (> 0) |
| on_power_pct | `number` | "On" power as % FTP (0-200) |
| off_power_pct | `number` | "Off" power as % FTP (0-200) |

#### FreerideStep

Unstructured riding time (used as fallback for ambiguous content).

| Field | Type | Description |
|-------|------|-------------|
| type | `"freeride"` | Discriminator |
| duration_s | `number` | Duration in seconds (> 0) |

### Step (Union Type)

```
Step = WarmupStep | CooldownStep | SteadyStep | IntervalsStep | FreerideStep
```

### Workout

Top-level entity representing a complete training session.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | `string` | Yes | Workout name (1-100 chars) |
| description | `string` | No | Optional description |
| steps | `Step[]` | Yes | Ordered array of workout steps (≥ 1) |

### ParseResponse

Response from the `/api/workouts/parse` endpoint.

| Field | Type | Description |
|-------|------|-------------|
| workout | `Workout` | Parsed workout structure |
| warnings | `string[]` | Array of warning messages for ambiguous content |
| confidence | `number` | AI confidence score (0.0 - 1.0) |

### ParseError

Error response from parsing endpoint.

| Field | Type | Description |
|-------|------|-------------|
| error | `string` | Human-readable error message |
| code | `string` | Error code for programmatic handling |
| details | `object?` | Optional additional details |

## Zod Schema Implementation

```typescript
// lib/schemas/workout.ts

import { z } from 'zod';

// Step schemas
export const WarmupStepSchema = z.object({
  type: z.literal('warmup'),
  duration_s: z.number().positive(),
  power_start_pct: z.number().min(0).max(200),
  power_end_pct: z.number().min(0).max(200),
});

export const CooldownStepSchema = z.object({
  type: z.literal('cooldown'),
  duration_s: z.number().positive(),
  power_start_pct: z.number().min(0).max(200),
  power_end_pct: z.number().min(0).max(200),
});

export const SteadyStepSchema = z.object({
  type: z.literal('steady'),
  duration_s: z.number().positive(),
  power_pct: z.number().min(0).max(200),
});

export const IntervalsStepSchema = z.object({
  type: z.literal('intervals'),
  repeat: z.number().int().min(1),
  on_duration_s: z.number().positive(),
  off_duration_s: z.number().positive(),
  on_power_pct: z.number().min(0).max(200),
  off_power_pct: z.number().min(0).max(200),
});

export const FreerideStepSchema = z.object({
  type: z.literal('freeride'),
  duration_s: z.number().positive(),
});

// Discriminated union
export const StepSchema = z.discriminatedUnion('type', [
  WarmupStepSchema,
  CooldownStepSchema,
  SteadyStepSchema,
  IntervalsStepSchema,
  FreerideStepSchema,
]);

// Workout schema
export const WorkoutSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  steps: z.array(StepSchema).min(1),
});

// Parse response
export const ParseResponseSchema = z.object({
  workout: WorkoutSchema,
  warnings: z.array(z.string()),
  confidence: z.number().min(0).max(1),
});

// Type exports
export type WarmupStep = z.infer<typeof WarmupStepSchema>;
export type CooldownStep = z.infer<typeof CooldownStepSchema>;
export type SteadyStep = z.infer<typeof SteadyStepSchema>;
export type IntervalsStep = z.infer<typeof IntervalsStepSchema>;
export type FreerideStep = z.infer<typeof FreerideStepSchema>;
export type Step = z.infer<typeof StepSchema>;
export type Workout = z.infer<typeof WorkoutSchema>;
export type ParseResponse = z.infer<typeof ParseResponseSchema>;
```

## Relationships

```
ParseResponse
    └── workout: Workout
    │       └── steps: Step[] (1..n)
    │               └── WarmupStep | CooldownStep | SteadyStep | IntervalsStep | FreerideStep
    └── warnings: string[]
    └── confidence: number
```

## Validation Rules

### Business Rules

1. **Workout name**: Required, 1-100 characters
2. **Steps array**: At least one step required
3. **Duration**: All durations must be positive integers (seconds)
4. **Power values**: 0-200% FTP range (some workouts have >100% efforts)
5. **Intervals repeat**: At least 1 repetition

### Data Integrity

1. **Type discriminator**: Must match one of the five valid types
2. **Numeric bounds**: Enforced by Zod schema
3. **Confidence score**: 0.0 to 1.0 inclusive

## State Transitions

The workout data follows this lifecycle:

```
[Image Upload]
      │
      ▼
[Parse API] ──→ ParseResponse { workout, warnings, confidence }
      │
      ▼
[Client State] ──→ Editable Workout (React state)
      │
      ├── Edit step values
      ├── Edit workout name
      ├── Dismiss warnings
      │
      ▼
[Export API] ──→ ZWO XML file
```

## Example Data

### Simple Workout

```json
{
  "workout": {
    "name": "Sweet Spot 30",
    "description": "30 minute sweet spot session",
    "steps": [
      { "type": "warmup", "duration_s": 600, "power_start_pct": 50, "power_end_pct": 75 },
      { "type": "steady", "duration_s": 1200, "power_pct": 88 },
      { "type": "cooldown", "duration_s": 300, "power_start_pct": 70, "power_end_pct": 40 }
    ]
  },
  "warnings": [],
  "confidence": 0.95
}
```

### Interval Workout with Warnings

```json
{
  "workout": {
    "name": "VO2 Max Intervals",
    "steps": [
      { "type": "warmup", "duration_s": 600, "power_start_pct": 45, "power_end_pct": 70 },
      { "type": "intervals", "repeat": 5, "on_duration_s": 180, "off_duration_s": 180, "on_power_pct": 120, "off_power_pct": 50 },
      { "type": "freeride", "duration_s": 300 },
      { "type": "cooldown", "duration_s": 300, "power_start_pct": 60, "power_end_pct": 35 }
    ]
  },
  "warnings": [
    "Step 3: Duration unclear in image, estimated 5 minutes",
    "Overall: Some text partially obscured"
  ],
  "confidence": 0.72
}
```
