# Quickstart: ImageToFit Development

**Feature**: 001-workout-image-to-zwo  
**Date**: 2025-12-26

## Prerequisites

- Node.js 18+ (LTS recommended)
- npm or pnpm
- OpenAI API key with GPT-4 Vision access

## Initial Setup

### 1. Clone and Install

```bash
git clone https://github.com/tcrevel/imagetofit.git
cd imagetofit
git checkout 001-workout-image-to-zwo
npm install
```

### 2. Environment Configuration

Copy the environment template and add your API key:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Required
OPENAI_API_KEY=sk-your-api-key-here

# Optional (defaults shown)
OPENAI_MODEL_VISION=gpt-4o
MAX_UPLOAD_MB=10
IMAGE_MAX_WIDTH=2000
```

### 3. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Landing page (/)
│   ├── app/page.tsx       # Main app (/app)
│   └── api/workouts/      # API routes
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── landing/          # Landing page sections
│   └── workout/          # App components
├── lib/                   # Shared code
│   ├── schemas/          # Zod schemas
│   ├── services/         # Business logic
│   └── utils/            # Utilities
└── __tests__/            # Test files
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test` | Run unit tests (Vitest) |
| `npm run test:watch` | Run tests in watch mode |

## Key Files

### Schemas

`lib/schemas/workout.ts` - Zod schemas for workout data validation

### API Routes

- `app/api/workouts/parse/route.ts` - Image parsing endpoint
- `app/api/workouts/export/zwo/route.ts` - ZWO export endpoint

### Services

- `lib/services/openai.ts` - OpenAI Vision integration
- `lib/services/zwo-export.ts` - ZWO XML generation

## Adding shadcn/ui Components

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add alert
npx shadcn-ui@latest add input
npx shadcn-ui@latest add table
```

## Testing

### Run All Tests

```bash
npm run test
```

### Run Specific Test File

```bash
npm run test -- zwo-export
```

### Test Coverage

```bash
npm run test -- --coverage
```

## API Testing

### Parse Endpoint (with curl)

```bash
curl -X POST http://localhost:3000/api/workouts/parse \
  -F "file=@workout.jpg" \
  -F "ftp=250"
```

### Export Endpoint (with curl)

```bash
curl -X POST http://localhost:3000/api/workouts/export/zwo \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","steps":[{"type":"steady","duration_s":300,"power_pct":75}]}' \
  -o test.zwo
```

## Debugging

### Environment Variables

Verify env vars are loaded:

```typescript
console.log('API Key loaded:', !!process.env.OPENAI_API_KEY);
```

### Request Logging

Each API request includes `X-Request-Id` header for tracing.

### Common Issues

| Issue | Solution |
|-------|----------|
| "OPENAI_API_KEY not set" | Check `.env.local` exists and has valid key |
| 413 Payload Too Large | Increase `MAX_UPLOAD_MB` or resize image |
| Rate limit errors | Wait 60 seconds between requests |
| Invalid XML export | Check workout schema validation |

## Constitution Compliance Checklist

Before committing, verify:

- [ ] No `OPENAI_API_KEY` in client code or `NEXT_PUBLIC_*` vars
- [ ] Parse response includes `warnings[]` and `confidence`
- [ ] FreeRide used for ambiguous content (not guessing)
- [ ] ZWO export passes XML validation tests
- [ ] UI works on 375px viewport
- [ ] No image persistence (memory only)
- [ ] Rate limiting enabled on parse endpoint

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add `OPENAI_API_KEY` in Environment Variables
4. Deploy

### Environment Variables for Production

```
OPENAI_API_KEY=sk-xxx
OPENAI_MODEL_VISION=gpt-4o
MAX_UPLOAD_MB=10
IMAGE_MAX_WIDTH=2000
```

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [OpenAI Vision API](https://platform.openai.com/docs/guides/vision)
- [ZWO File Format](https://github.com/h4l/zwift-workout)
- [Zod Documentation](https://zod.dev)
