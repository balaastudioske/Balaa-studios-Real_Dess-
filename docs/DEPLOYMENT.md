# Firebase deployment

The Firebase project is configured as `balaa-studios-control-system` in `.firebaserc`.

1. Populate production values from `.env.example` in Firebase App Hosting or the runtime secret store. Never commit `.env.local`.
2. Authenticate with an account that has deploy access: `firebase login`.
3. Validate locally: `npm run type-check`, `npm run lint`, `npm run build`.
4. Deploy: `firebase deploy --only hosting`.

This framework-aware hosting configuration needs a Node-capable backend because the app has Next.js route handlers. Verify stage, YouTube wall, admin sign-in, wardrobe and API routes after release.
