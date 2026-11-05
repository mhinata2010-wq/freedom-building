# FIELDNOTE | Sketch to Schedule

**Draw freely. Turn the canvas into a construction schedule.**

Figma/FigJam-like editing experience (not a copy and not feature parity): draggable task cards, freehand pen, sticky notes, text, resizable items, arrow dependencies, zoom/pan, keyboard shortcuts, undo/redo, local save, JSON/CSV/SVG/PNG export, and a Gantt preview.

## Quick start (Node 20+, zero npm dependencies)

```bash
npm run dev
# http://localhost:4173
npm test
npm run check
```

No API key required for the core interface. The browser fallback **is not AI**: it uses explicit task cards, durations and arrows. It does **not** claim to understand handwriting.

### Enable vision AI

```bash
cp .env.example .env
# Add OPENAI_API_KEY=... to .env (server only)
npm run dev
```

Click **AIで工程表を生成**. The browser sends a canvas PNG + structured shape/arrow data including grouped pen-stroke regions to `/api/analyze`, which calls OpenAI's Responses API with structured JSON output. It extracts candidate tasks and returns a **draft**, never commits inferred dependencies automatically. The draft is reviewed in the right sidebar and every task can be edited and confirmed.

**Security**: Never put OPENAI_API_KEY in frontend code or GitHub. No login or durable server-side rate limit is implemented, so **do not expose an unprotected public AI endpoint**. Before a real public launch add authentication, proper per-user quotas, billing controls, durable rate limits, and consent for uploads. The MVP stores board data in this browser's localStorage only; other devices cannot see it.

## Functional scope

| Item | State |
|---|---|
| SVG canvas with cards, notes, freehand, connected arrows, text, drag, resize | MVP implemented |
| Pan, zoom, toolbar, keyboard shortcuts, undo/redo | MVP implemented |
| Automatic extraction from *typed card text + explicit arrows* | Local rules implemented |
| Screenshot + vector metadata to vision model | Requires server `OPENAI_API_KEY` |
| Human review for durations, dependencies and start dates | MVP implemented |
| Gantt preview, CSV/JSON/SVG/PNG export | MVP implemented |
| Autosave | Browser localStorage only |
| Auth, sync, multiuser, print layout, calendar exceptions, holiday/weekend scheduling | Not implemented |
| Handwriting recognition grouped by spatial proximity | Experimental with AI key; needs evaluation and corrections |
| Production-grade construction scheduling including resource constraints | Not implemented |

The scheduler uses **calendar days**, not business days; it assumes a successor starts the day after a predecessor finishes. Real project calendars, holidays, weather downtime, lead times and parallel resource conflicts are future work.

## Preview

Run `npm run dev` to open the current UI. Screenshot assets are not part of this source commit.

Full architecture and acceptance criteria: [docs/architecture.md](docs/architecture.md).

## Files

- `index.html` and `styles.css`: responsive frontend shell
- `src/app.js`: interactive canvas & UX
- `src/scheduler.js`: pure data extraction and scheduling functions
- `api/analyze.js`: optional server-side AI endpoint (Vercel-compatible)
- `server/dev.mjs`: zero-dependency local server
- `tests/scheduler.test.js`: regression tests

## Deploy

This repository is currently **public**. No credentials are included; do not commit `.env` or expose an unauthenticated AI endpoint.

For local development: `npm run dev`. The browser rule-based fallback runs without a key. To test vision AI locally, set `OPENAI_API_KEY` in an untracked `.env` file. Production deployment requires authentication, durable rate limits and budget controls before enabling the AI endpoint.

The development branch should be reviewed through a pull request before merging to `main`.

### Next milestones

1. Improve handwritten OCR grouping, labeled canvas regions, and uncertainty UX; run accuracy evaluations.
2. Manual link editing + dependency cycle editor and calendars (weather and workdays).
3. IndexedDB/DB persistence, collaboration, audit history, role-based access.
4. Field tests with construction supervisors and usability benchmarks.

### Design rationale

Figma's UI is a reference for direct manipulation and tool discoverability, not an attempt to copy Figma's branded assets or achieve arbitrary “90% feature parity.” This zero-dependency SVG canvas avoids production licensing constraints of certain SDKs. Plan to test interactions on actual jobsite hardware before choosing a heavier canvas engine.
