# Milestone 1 — imported asset intake

Status: complete (structural intake only; visual acceptance remains pending).

## Decisions

- `public/assets/models/dess.glb` remains the only master artist. It has 73 joints and 84 morph targets; generic downloaded humans are not eligible because they have no rig, facial targets, or compatible materials.
- Promote the 113-joint `Artist_performing_hip_hop_track_202608151513` source as the primary performance clip. It covers full body plus hands and maps semantically to Dess.
- Promote the 108-mesh outdoor stage as the runtime stage kit. The 53 MB Meshy city GLB is retained as a source/reference only because it is a monolithic single-mesh asset with no interaction boundaries.
- The 18-joint BVH contains a partial left-hand finger chain only. It is a reference for secondary finger behavior, not a replacement skeleton.

## Required follow-up verification

1. Capture runtime footage of the hip-hop clip on Dess wearing Look 02 (the black-and-white hoodie) and test the finger layer at close range.
2. Check the promoted stage model against the supplied sunset-stage reference and split/replace geometry only where a visual capture shows a mismatch.
3. Do not delete archived intake assets until a human signs off on the visual comparison.

## Milestone 2 — runtime binding gate

- `scripts/validate-runtime-garments.mjs` binds every final garment to Dess's live skeleton and checks weighted vertex displacement under a shoulder pose.
- Both public and studio avatar consumers bind selected garments to the live skeleton so each look follows Dess's animation mixer instead of behaving as a static scene mesh.
- `scripts/convert-bvh-reference.mjs` converts BVH intake to a portable GLB skeleton/clip reference; do not use the resulting partial hand chain as a replacement for Dess's full rig.
