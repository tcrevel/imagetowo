# API Contract: Parse Workout Image

**Endpoint**: `POST /api/workouts/parse`  
**Feature**: 001-workout-image-to-zwo

## Overview

Accepts an uploaded workout image and returns a structured workout JSON with confidence score and any parsing warnings.

## Request

### Content-Type

`multipart/form-data`

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| file | `File` | Yes | Image file (JPEG, PNG, WebP) |
| ftp | `number` | No | User's FTP in watts (for converting absolute watts to %) |
| locale | `string` | No | Language hint for parsing (default: "en") |
| unitsPreference | `string` | No | `"pct_ftp"` \| `"watts"` \| `"auto"` (default: "auto") |
| notes | `string` | No | Additional context to help parsing |

### Constraints

- **Max file size**: Configurable via `MAX_UPLOAD_MB` env (default: 10MB)
- **Allowed MIME types**: `image/jpeg`, `image/png`, `image/webp`
- **Rate limit**: 10 requests per minute per IP

## Response

### Success (200 OK)

High confidence parsing with complete workout structure.

```json
{
  "workout": {
    "name": "Morning Intervals",
    "description": "High intensity session",
    "steps": [
      {
        "type": "warmup",
        "duration_s": 600,
        "power_start_pct": 50,
        "power_end_pct": 75
      },
      {
        "type": "intervals",
        "repeat": 5,
        "on_duration_s": 60,
        "off_duration_s": 60,
        "on_power_pct": 120,
        "off_power_pct": 50
      },
      {
        "type": "cooldown",
        "duration_s": 300,
        "power_start_pct": 65,
        "power_end_pct": 40
      }
    ]
  },
  "warnings": [],
  "confidence": 0.95
}
```

### Partial Success (422 Unprocessable Entity)

Parsing completed but with significant ambiguity. Workout is returned but may need manual correction.

```json
{
  "workout": {
    "name": "Unknown Workout",
    "steps": [
      {
        "type": "warmup",
        "duration_s": 600,
        "power_start_pct": 50,
        "power_end_pct": 70
      },
      {
        "type": "freeride",
        "duration_s": 600
      },
      {
        "type": "cooldown",
        "duration_s": 300,
        "power_start_pct": 60,
        "power_end_pct": 40
      }
    ]
  },
  "warnings": [
    "Could not read workout name - using default",
    "Step 2: Text illegible, converted to 10-minute freeride",
    "Overall confidence low due to image quality"
  ],
  "confidence": 0.45
}
```

### Errors

#### 400 Bad Request

Missing or invalid file.

```json
{
  "error": "No file provided",
  "code": "MISSING_FILE"
}
```

```json
{
  "error": "Invalid file type. Accepted: JPEG, PNG, WebP",
  "code": "INVALID_FILE_TYPE"
}
```

#### 413 Payload Too Large

File exceeds size limit.

```json
{
  "error": "File too large. Maximum size: 10MB",
  "code": "FILE_TOO_LARGE"
}
```

#### 429 Too Many Requests

Rate limit exceeded.

```json
{
  "error": "Rate limit exceeded. Please wait before trying again.",
  "code": "RATE_LIMITED",
  "retryAfter": 60
}
```

#### 500 Internal Server Error

Unexpected error during processing.

```json
{
  "error": "An error occurred while processing your image",
  "code": "PROCESSING_ERROR",
  "requestId": "req_abc123"
}
```

## Headers

### Request Headers

| Header | Required | Description |
|--------|----------|-------------|
| Content-Type | Yes | Must be `multipart/form-data` |

### Response Headers

| Header | Description |
|--------|-------------|
| X-Request-Id | Unique request identifier for debugging |
| X-RateLimit-Limit | Maximum requests per window |
| X-RateLimit-Remaining | Remaining requests in current window |
| X-RateLimit-Reset | Unix timestamp when window resets |

## Implementation Notes

### Server-Side Processing Flow

1. Validate file presence and type
2. Check file size against limit
3. Check rate limit
4. Generate request ID for logging
5. Resize image if > IMAGE_MAX_WIDTH
6. Convert image to base64
7. Call OpenAI Vision API with structured prompt
8. Parse and validate response against Zod schema
9. Apply normalization rules (minutes→seconds, etc.)
10. Calculate/verify confidence score
11. Return response with appropriate status code

### Security Considerations

- Image is processed in memory only (never persisted)
- OpenAI API key used server-side only
- Request ID logged without sensitive content
- Rate limiting per IP address

### Constitution Compliance

| Principle | Implementation |
|-----------|----------------|
| I. Security-First | API key in env var only, server-side processing |
| II. Honest AI | warnings[] + confidence always returned, fallback to FreeRide |
| V. Privacy by Default | No image persistence, rate limiting |
