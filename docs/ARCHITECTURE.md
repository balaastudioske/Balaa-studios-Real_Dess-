# BALAA STUDIOS — System Architecture Documentation

## 1. Executive Summary

**BALAA STUDIOS** is a high-performance, web-native 3D performance and virtual concert platform. The system orchestrates interactive 3D avatars, dynamic stage environments, audio-reactive visual systems, real-time live events, and commercial licensing pipelines.

---

## 2. Technology Stack & Core Dependencies

| Layer | Technologies | Role / Responsibility |
|---|---|---|
| **Frontend Framework** | Next.js 16 (App Router), React 19, TypeScript | Server Components, dynamic route handlers, client-side hydration |
| **3D Rendering & Shaders** | Three.js (r185), React Three Fiber (v9), Drei (v10), Postprocessing (v3) | WebGL rendering, scene graphs, custom NPR/Toon shaders, camera interpolation |
| **Timeline & Orchestration** | Theatre.js (Core, R3F, Studio) | Cinematic sequence authoring, keyframe tracks, timeline playback |
| **State Management** | Zustand (v5) | Audio playback, stage/render modes, camera presets, wardrobe, stage layouts |
| **Styling & UI Overlay** | Tailwind CSS v4, Lucide React | Cyberpunk/dark-themed responsive HUDs, control room panels, drawers |
| **Backend & Real-Time Sync** | FastAPI (Python 3.10+), WebSockets | Live event room management, multi-client timestamp sync, audio analysis |
| **Hosting & Cloud Services** | Firebase App Hosting (`balaa-studios-control-system`), Node backend runtime | Framework-aware deployment, cloud asset delivery, API routing |
| **Commerce & Payments** | Safaricom M-Pesa (Buy Goods Till 5834631), Stripe | Direct track master licensing, merchandise purchases, live event ticketing |

---

## 3. System Architecture & Component Topology

```
+-----------------------------------------------------------------------------------+
|                                  CLIENT BROWSER                                   |
|                                                                                   |
|  +-------------------------------------+  +------------------------------------+  |
|  |       Next.js App Router (UI)       |  |     React Three Fiber (WebGL)      |  |
|  | - StageHUD / SongSelector           |  | - StageViewport                    |  |
|  | - SpatialWardrobeShowroom           |  | - ArtistAvatar (DESS Master Rig)   |  |
|  | - MerchDrawer / LicensingModal      |  | - StageMediaWall (YouTube / Canvas)|  |
|  | - Admin Studio Suites               |  | - SpaceStageEnvironment & Set      |  |
|  +-------------------------------------+  +------------------------------------+  |
|                     |                                       |                     |
|                     +-------------------+-------------------+                     |
|                                         |                                         |
|                             +-----------------------+                             |
|                             | Zustand State Layer   |                             |
|                             | - useAppStore         |                             |
|                             | - useStageLayoutStore |                             |
|                             +-----------------------+                             |
+-----------------------------------------|-----------------------------------------+
                                          |
                +-------------------------+-------------------------+
                |                                                   |
                v (HTTPS / REST)                                    v (WSS / Real-time)
+--------------------------------+                  +--------------------------------+
|      Next.js Route Handlers    |                  |        FastAPI Backend         |
|  (/api/admin, /api/wardrobe,   |                  |  (/ws/events/{id}, /analyze/*, |
|   /api/avatar, /api/events)    |                  |   /lipsync, /export/video)     |
+--------------------------------+                  +--------------------------------+
                |                                                   |
                v                                                   v
+--------------------------------+                  +--------------------------------+
|  Local Storage / Public Assets |                  | Live Room Orchestration &      |
|  (public/library/*, dess.glb)  |                  | Audio / AI Feature Analysis    |
+--------------------------------+                  +--------------------------------+
```

---

## 4. 3D Graphics & Rendering Pipeline

### 4.1 Master Avatar Architecture
- **Source Model:** `public/assets/models/dess.glb` (Mixamo humanoid skeleton without `mixamorig_` prefix, 84 ARKit facial blendshapes).
- **Runtime Execution (`ArtistAvatar.tsx`):**
  - Uses `SkeletonUtils.clone` to instantiate independent rig instances without memory leaks.
  - Mixamo animation library (30 FBX clips) driven by `AnimationMixer` cross-fades.
  - ARKit facial phoneme lip-sync coordinated with audio tracks (`Cure`, `Master`, `Zainabu`).
  - Dynamic wardrobe binding: foundation garments conform to avatar bones via vertex-weight normalization.

### 4.2 Scene & Environment Architecture
- **Origin Anchor:** The performance stage is anchored at `(0, 0, 0)`.
- **Physical Set (`BalaaPhysicalSet.tsx`):** Renders studio mixing desks, audio racks, synthesizer, and monitor fixtures.
- **Atmosphere & Sky (`SpaceStageEnvironment.tsx`):** Renders celestial skydome, parallax starfield, and volumetric fog enclosure.
- **Media Wall (`StageMediaWall.tsx`):** Dynamic curved screen backdrop integrating YouTube player playback and audio-reactive frequency textures (optimized at 1440x525 with idle gating).

### 4.3 Cinematic Camera Rig (`StageViewportCamera.tsx`)
- Authoritative camera at default `[0, 1.8, 6.2]`, target `[0, 1.2, 0]`, FOV 44.
- Predefined cinematic presets: `stage-full`, `stage-3d`, `top-view`, `close-up`, `artist-close`, `over-shoulder`.
- Smooth frame interpolation (`lerp`) between camera modes; `OrbitControls` isolated to free explore mode.

### 4.4 Stylized Post-Processing (`NPRPostProcessing.tsx`, `AnimeOutlinePipeline.tsx`)
- Hybrid rendering: combines screen-space edge detection, halftone dot rasterization, cross-hatching, and subtle chromatic aberration with toggleable photorealistic (PBR) mode.

---

## 5. Application Routing Structure

| Route | Mode | Description |
|---|---|---|
| `/` | Static (SSG) | Main interactive 3D performance stage, music player, wardrobe previewer, merch drawer |
| `/events` | Static (SSG) | Live ticketed show schedule, event countdown, M-Pesa Buy Goods Till payment instructions |
| `/admin` | Dynamic (SSR) | Admin dashboard for live broadcast scheduling and room moderation |
| `/admin/studio` | Dynamic (SSR) | 3D Rig Tuner & bone scale calibration suite |
| `/admin/studio/animation` | Dynamic (SSR) | 3D Animation DAW (clip import, loop trimming, Mixamo remapping) |
| `/admin/studio/avatar` | Dynamic (SSR) | Avatar Remodeler (vertex deformation, skin tone, blendshapes) |
| `/admin/studio/director` | Dynamic (SSR) | Scene Director (timed choreography cues, camera switching) |
| `/admin/studio/garments` | Dynamic (SSR) | Garment Converter (mesh placement and foundation fitting) |
| `/admin/studio/lighting` | Dynamic (SSR) | Studio Lighting console (key, fill, rim, ground neon) |
| `/admin/studio/scenes` | Dynamic (SSR) | Set composition and 10s video capture studio |
| `/admin/studio/stage` | Dynamic (SSR) | Stage prop arrangement and motion tester |
| `/admin/studio/wardrobe` | Dynamic (SSR) | Wardrobe Designer (mesh toggles, color palette configuration) |

---

## 6. Server APIs & Security Architecture

### 6.1 Authentication & Server Routes (`src/app/api/`)
- **Admin Authentication (`/api/admin/auth`):** HTTP-only, secure, signed session cookies. Server passwords validated via constant-time comparison (`crypto.timingSafeEqual`).
- **Asset Mutations (`/api/avatar/save-mesh`, `/api/wardrobe/save-design`):** Restricted to authenticated admin sessions; path containment prevents directory traversal; 25MB payload limit on binary uploads.
- **Event Scheduling (`/api/events`, `/api/admin/events`):** Event lifecycle management with sanitized JSON payloads.
- **Catalog Service (`/api/merch/catalog`):** High-speed statically cached endpoint serving 10 reference-mapped merchandise items.

### 6.2 Security Headers (`next.config.ts`)
- Content-Security-Policy (CSP) enforcing strict script, connect, and media sources (YouTube, Google APIs, WebSockets).
- `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`.

---

## 7. Real-Time Event Backend (`backend/`)

- **FastAPI Engine (`backend/main.py`):**
  - Authenticated WebSocket rooms (`/ws/events/{event_id}`).
  - Low-latency sequence synchronization across distributed audience clients.
  - Audience live chat, emoji reactions, and roster presence tracking.
  - Safe payload parsing (`json.loads`) with strict CORS restriction.
- **Analysis Modules (`backend/engines/`):**
  - Audio spectrum and BPM extraction (`audio_analysis.py`).
  - ARKit blendshape phoneme generation (`lipsync.py`).
  - Video rendering and capture utilities (`video_export.py`).

---

## 8. Business & Commercial Licensing Model

- **Direct Song Master Licensing:** 7 standard tiers (Kiosk KSh 100, Creator KSh 300, Business KSh 500, Event KSh 1,000, Commercial KSh 2,500, Large Campaign KSh 5,000, Special Commercial KSh 10,000). Standard exchange conversion rate: KSh 100 = $1 USD.
- **Production Services:** Music Video Production (KSh 25,000), Live Performance (KSh 7,000), Studio & Vocal Sessions (KSh 6,500), Video Editing & Colour Grade (KSh 5,000), Artist Appearance (KSh 2,000).
- **Payment Processing:** Direct M-Pesa Buy Goods Till `5834631` + Stripe integration.
