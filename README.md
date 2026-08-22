# BALAA STUDIOS — Web-Native 3D Performance Platform

## Overview

**BALAA STUDIOS** is a web-native 3D performance and concert platform powered by Next.js App Router, React Three Fiber (R3F), and Theatre.js. Fans can experience live-authored 3D avatar performances, explore dynamic stages and wardrobe showrooms, and join synchronized ticketed virtual events.

## Tech Stack

- **Frontend:** Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS v4
- **3D Graphics:** Three.js (r185) + React Three Fiber (v9) + Drei (v10) + Postprocessing (v3)
- **Cinematic Timeline:** Theatre.js (Core, R3F, Studio)
- **State Management:** Zustand (v5)
- **Backend:** FastAPI (Python 3.10+) + WebSockets (for live room sync and audio analysis)
- **Commerce:** Direct Song Master Licensing, M-Pesa Buy Goods Till `5834631`, Stripe Checkout
- **Deployment:** Firebase App Hosting (`balaa-studios-control-system`)

## Quick Start

```bash
# Frontend
npm install
npm run dev

# Backend (optional, for real-time live events and audio analysis)
cd backend
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt
python main.py
```

## Project Structure

```
src/
  app/                    # Next.js App Router
    page.tsx              # Main 3D performance stage & music player
    events/               # Live ticketed event lobby & schedule
    admin/                # Admin event moderation dashboard
      studio/             # 3D Studio Suites (Rig, Animation, Avatar, Garments, etc.)
    api/                  # Server route handlers (auth, events, wardrobe, avatar)
  components/
    3d/                   # React Three Fiber components & shaders
    ui/                   # UI overlays, HUDs, modals, and drawers
  store/                  # Zustand state stores (useAppStore, useStageLayoutStore)
  lib/                    # Utilities, catalog constants, sequence definitions
  hooks/                  # Custom React & 3D hooks
  types/                  # TypeScript type definitions
backend/                  # FastAPI real-time WebSocket & audio analysis server
public/                   # Static runtime 3D models (dess.glb), textures, audio
library/                  # Garment definitions, outfit mappings, moodboards
docs/                     # Architecture, security, and deployment documentation
```

## Development Commands

| Command | Description |
|---|---|
| `npm run dev` | Start Next.js development server |
| `npm run build` | Compile production build |
| `npm run type-check` | Run TypeScript validation (`tsc --noEmit`) |
| `npm run lint` | Run ESLint across source files |

## Core Architectural Principles

- **Anchored Stage Coordinate System:** The main performance stage is anchored at `(0, 0, 0)`.
- **Master Artist Rig:** `dess.glb` (Mixamo skeleton, 84 ARKit facial blendshapes) is the authoritative artist rig.
- **Single Source of Truth:** One production GLB per garment shared across Marketplace, Wardrobe, and Previews.
- **Audience Multi-Client Sync:** Real-time millisecond-accurate timestamp sync via WebSocket rooms.
- **Server Hardening:** HTTP-only authenticated admin sessions, constant-time password comparisons, sanitized payloads, and strict CORS/CSP.

## License

See LICENSE file for details.

