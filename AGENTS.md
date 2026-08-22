# AGENTS.md — BALAA STUDIOS Developer & Agent Rules

## Project Overview

BALAA STUDIOS is a lightweight, web-native 3D performance and commercial website built with:
- Next.js 16 (App Router)
- React Three Fiber (R3F) & Three.js
- TypeScript
- Tailwind CSS v4
- Zustand (state management)
- Safaricom M-Pesa (Buy Goods Till 5834631) & Direct Song Master Licensing
- FastAPI (backend, for real-time live event synchronization)
- Firebase App Hosting (`balaa-studios-control-system`)

## Development Setup

```bash
npm install          # Install frontend dependencies
npm run dev          # Start dev server at http://localhost:3000

# Backend (optional, for real-time live events)
cd backend
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt
python main.py       # Starts on http://localhost:8000
```

## Key Scripts

- `npm run dev` — Next.js dev server
- `npm run build` — Production build
- `npm run lint` — ESLint
- `npm run type-check` — TypeScript type check (`tsc --noEmit`)

## Code Conventions

- Use TypeScript throughout (`@/` import alias)
- React Server Components by default; use `'use client'` for interactive components
- Tailwind CSS for styling (dark/cyberpunk theme)
- File naming: kebab-case for files, PascalCase for components
- Zustand for state, custom React hooks for 3D logic

## Architectural Principles

1. **Commercial 3D Experience:** The site is a 3D digital showroom for REAL DESS merchandise, music licensing, creative services, and live events.
2. **Animation Decoupling:** The website consumes pre-baked GLB animations, runtime `AnimationMixer` playback, and audio-driven lip-sync. Animation authoring is decoupled into a separate future tool.
3. **Single Performance Clock:** Audio playback clock (`audio.currentTime`) drives animation progression, ARKit blendshapes, and camera direction.
4. **Master Artist Rig:** `dess.glb` (Mixamo skeleton without `mixamorig_` prefix, 84 ARKit blendshapes) is the authoritative artist.
5. **Stage & Camera:** Slow, subtle, continuous orbiting stage with front-locked Artist Mode camera (`cameraTransform = stageTransform * fixedArtistFrontOffset`).
6. **Validation Gates:** `npm run type-check` and `npm run build` must pass cleanly.

