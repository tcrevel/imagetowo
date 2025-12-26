# API Contract: Export ZWO

**Endpoint**: `POST /api/workouts/export/zwo`  
**Feature**: 001-workout-image-to-zwo

## Overview

Accepts a canonical workout JSON and returns a valid .zwo XML file for import into Zwift, Intervals.icu, or TrainingPeaks.

## Request

### Content-Type

`application/json`

### Body

Standard workout object matching the canonical schema.

```json
{
  "name": "Sweet Spot 45",
  "description": "45 minute sweet spot session",
  "steps": [
    {
      "type": "warmup",
      "duration_s": 600,
      "power_start_pct": 50,
      "power_end_pct": 75
    },
    {
      "type": "steady",
      "duration_s": 1800,
      "power_pct": 88
    },
    {
      "type": "intervals",
      "repeat": 3,
      "on_duration_s": 300,
      "off_duration_s": 120,
      "on_power_pct": 95,
      "off_power_pct": 55
    },
    {
      "type": "cooldown",
      "duration_s": 300,
      "power_start_pct": 70,
      "power_end_pct": 40
    }
  ]
}
```

### Validation Rules

- `name`: Required, 1-100 characters
- `description`: Optional string
- `steps`: Required, at least one step
- All step fields must match their type schema
- Power values: 0-200 (percentage of FTP)
- Durations: positive integers (seconds)

## Response

### Success (200 OK)

Returns the .zwo XML file as an attachment.

#### Headers

```
Content-Type: application/xml
Content-Disposition: attachment; filename="sweet-spot-45.zwo"
```

#### Body

```xml
<?xml version="1.0" encoding="UTF-8"?>
<workout_file>
  <author>ImageToFit</author>
  <name>Sweet Spot 45</name>
  <description>45 minute sweet spot session</description>
  <sportType>bike</sportType>
  <workout>
    <Warmup Duration="600" PowerLow="0.50" PowerHigh="0.75"/>
    <SteadyState Duration="1800" Power="0.88"/>
    <IntervalsT Repeat="3" OnDuration="300" OffDuration="120" OnPower="0.95" OffPower="0.55"/>
    <Cooldown Duration="300" PowerLow="0.70" PowerHigh="0.40"/>
  </workout>
</workout_file>
```

### Errors

#### 400 Bad Request

Invalid workout structure.

```json
{
  "error": "Invalid workout structure",
  "code": "VALIDATION_ERROR",
  "details": {
    "path": "steps[0].duration_s",
    "message": "Expected positive number"
  }
}
```

```json
{
  "error": "Workout name is required",
  "code": "MISSING_NAME"
}
```

```json
{
  "error": "At least one step is required",
  "code": "EMPTY_STEPS"
}
```

## ZWO Format Mapping

### Step Type to ZWO Element

| Step Type | ZWO Element | Power Attributes |
|-----------|-------------|------------------|
| warmup | `<Warmup>` | PowerLow, PowerHigh |
| cooldown | `<Cooldown>` | PowerLow, PowerHigh |
| steady | `<SteadyState>` | Power |
| intervals | `<IntervalsT>` | OnPower, OffPower |
| freeride | `<FreeRide>` | (none) |

### Power Conversion

Schema stores power as percentage integers (e.g., `88` = 88% FTP).
ZWO requires decimal fractions (e.g., `0.88`).

**Formula**: `zwoValue = schemaValue / 100`

### Duration

Both schema and ZWO use seconds. No conversion needed.

### XML Escaping

Special characters in `name` and `description` MUST be escaped:

| Character | Escape |
|-----------|--------|
| `&` | `&amp;` |
| `<` | `&lt;` |
| `>` | `&gt;` |
| `"` | `&quot;` |
| `'` | `&apos;` |

### Filename Generation

Filename is generated from workout name:
1. Convert to lowercase
2. Replace spaces with hyphens
3. Remove special characters (keep alphanumeric and hyphens)
4. Append `.zwo` extension

Example: `"Sweet Spot 45!"` → `sweet-spot-45.zwo`

## Implementation Notes

### Generation Flow

1. Validate incoming JSON against WorkoutSchema
2. If invalid, return 400 with details
3. Generate XML structure:
   - XML declaration
   - workout_file root
   - author (hardcoded "ImageToFit")
   - name (escaped)
   - description (escaped, if present)
   - sportType (hardcoded "bike")
   - workout element with step children
4. Map each step to appropriate ZWO element
5. Set Content-Disposition with slugified filename
6. Return XML response

### Constitution Compliance

| Principle | Implementation |
|-----------|----------------|
| III. Valid Export | Zod validation + XML escaping + unit tests |

## Test Cases

Export function MUST pass tests for:

1. Simple warmup-only workout
2. Cooldown-only workout
3. Single steady state
4. Single interval block
5. FreeRide segment
6. Complete workout with all step types
7. Workout with special characters in name (`&`, `<`, `>`, `"`, `'`)
8. Workout with Unicode characters
9. Maximum length name (100 chars)
10. Single step workout (minimum valid)
