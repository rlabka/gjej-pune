# GJP Mobile — Expo React Native App

Native iOS + Android client for GJP – Global Jobs Platform, mirroring
[apps/web](../web) 1:1.

## Stack
- **Expo SDK 52** (React Native 0.76, New Architecture enabled)
- **expo-router 4** (file-based routing)
- **TypeScript**
- **NativeWind v4** (Tailwind 3 config, mirrors web tokens)
- **expo-secure-store** for JWT tokens (Keychain / Keystore)
- **socket.io-client** for real-time chat
- **i18n-js** with 5 locales (de, en, fr, it, sq) shared with web

## Monorepo Integration
- Lives under `apps/mobile` alongside `apps/web`
- Resolves `@jmp/shared` from `packages/shared/src` via
  [metro.config.js](./metro.config.js) (no build step required)
- `@/*` maps to `./src/*`, `@app/*` maps to `./app/*`

## First-time setup

```bash
# From the monorepo root — installs deps for all workspaces, including mobile
npm install

# Create local env file
cp apps/mobile/.env.example apps/mobile/.env
# → edit EXPO_PUBLIC_API_URL to your backend URL (LAN IP or tunnel)
```

### Running the backend so the iPhone can reach it

The iPhone cannot reach `localhost` on your PC. Pick one:

**Option A — LAN IP** (PC + iPhone on same WiFi):
1. Find your PC's LAN IP: `ip addr show | grep inet`
2. Make sure the backend listens on `0.0.0.0:4000` (not just 127.0.0.1)
3. Set `EXPO_PUBLIC_API_URL=http://192.168.x.x:4000` in `.env`

**Option B — Tunnel** (works anywhere, even mobile data):
1. `npx ngrok http 4000` — get a public HTTPS URL
2. Set `EXPO_PUBLIC_API_URL=https://xxx.ngrok-free.app` in `.env`

## Running on iPhone (no Mac required)

1. Install **Expo Go** from the App Store on your iPhone
2. From the monorepo root:
   ```bash
   npm run start --workspace=@jmp/mobile
   ```
   or directly:
   ```bash
   cd apps/mobile && npm run start
   ```
3. A QR code appears in the terminal
4. On your iPhone: open the Camera app, point at the QR code, tap the
   "Open in Expo Go" banner
5. The app loads; edits in VS Code hot-reload instantly

If your WiFi blocks peer-to-peer connections (e.g. guest / corporate):
```bash
npm run start:tunnel --workspace=@jmp/mobile
```

## Running on Android

1. Install **Expo Go** from Play Store
2. Start the dev server (`npm run start`)
3. Scan QR with the Expo Go app

## Project layout

```
apps/mobile/
├── app/                  # expo-router (file-based)
│   ├── _layout.tsx       # Root (Providers, AuthProvider, i18n init)
│   ├── index.tsx         # Gate screen (redirects based on session)
│   ├── (auth)/
│   │   ├── login.tsx
│   │   └── register.tsx
│   └── (tabs)/
│       ├── _layout.tsx   # Bottom tab bar
│       ├── index.tsx     # Home
│       ├── search.tsx
│       ├── chat.tsx
│       ├── notifications.tsx
│       └── profile.tsx
├── src/
│   ├── lib/              # api, auth, storage, config
│   ├── contexts/         # AuthContext
│   ├── i18n/             # i18n-js setup
│   ├── messages/         # de/en/fr/it/sq JSON (copied from web)
│   └── components/       # (M2+)
├── assets/images/        # icon, splash, adaptive-icon
├── app.json              # Expo config (bundle: com.gjp.app)
├── babel.config.js
├── metro.config.js       # monorepo-aware
├── tailwind.config.js
└── global.css
```

## What works in M1 (this milestone)
- App boots on iPhone via Expo Go
- Session hydration from Secure Store → auto-route to Login or Tabs
- Login / Register against existing backend (`/api/auth/login`, `/api/auth/register`)
- Logout clears token + session
- Bottom-tab navigation with 5 tabs (placeholders for M2-M4 features)
- i18n initialization with device-locale detection

## What's NEXT
See [../../MOBILE_APP_PLAN.md](../../MOBILE_APP_PLAN.md) for the full milestone list.

- **M2** — Jobs, Candidates, Favorites, Profile editing, Google Sign-In
- **M3** — Real-time chat (Socket.IO)
- **M4** — Push Notifications (FCM + backend changes)
- **M5** — Premium UI + Legal screens
- **M6** — Release (TestFlight + Play Internal Testing)

## ⚠️ Missing for later milestones

These files will be needed but are NOT in Git (add via Firebase Console):
- `GoogleService-Info.plist` (iOS, for M2 Google Sign-In + M4 Push)
- `google-services.json` (Android, same)
