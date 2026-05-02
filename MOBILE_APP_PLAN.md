# GJP Mobile App — Masterplan

> **Projekt:** GJP – Global Jobs Platform
> **Stack:** Expo (SDK 52) + React Native + TypeScript + expo-router + NativeWind v4
> **Ziel:** 1:1 Frontend des bestehenden Next.js Web-Apps als native iOS + Android App
> **Monorepo-Integration:** `apps/mobile` neben `apps/web`, gemeinsame Nutzung von `packages/shared`

---

## 1. Projekt-Identität

| Feld | Wert |
|---|---|
| **App Store Display Name** | `GJP – Global Jobs Platform` |
| **Kurzname (Home-Screen)** | `GJP` |
| **Bundle ID (iOS)** | `com.gjp.app` |
| **Package Name (Android)** | `com.gjp.app` |
| **Expo Slug** | `gjp-mobile` |
| **Deep-Link Scheme** | `gjp://` |
| **Primäre Sprachen** | DE, EN, FR, IT, SQ |
| **Tagline** | „Jobs across Europe — find, match, connect." |

---

## 2. Tech-Stack Mapping (Web → Mobile)

| Web (Next.js) | Mobile (Expo) |
|---|---|
| Next.js App Router | **expo-router** (file-based) |
| Tailwind 4 | **NativeWind v4** |
| next-intl | **expo-localization** + `i18n-js` |
| framer-motion | **react-native-reanimated** + `moti` |
| lucide-react | **lucide-react-native** |
| Firebase Web SDK (Google-Login) | **@react-native-firebase/app + auth** |
| socket.io-client | **socket.io-client** (1:1) |
| localStorage (Tokens) | **expo-secure-store** |
| Fetch API | **Fetch** (portierter `lib/api.ts`) |
| File-Input | **expo-image-picker** + **expo-document-picker** |
| Push (keine) | **expo-notifications** + FCM/APNs |
| Stripe Checkout | *(nicht in App — Premium läuft nur über Web)* |

---

## 3. Architektur-Entscheidungen

### 3.1 Auth
- JWT weiterhin vom bestehenden Backend (`/api/auth/login`, `/api/auth/register`, `/api/auth/google`, `/api/auth/session`)
- Speicherung in **`expo-secure-store`** (verschlüsselter Keychain / Android Keystore)
- Google-Login nativ via `@react-native-firebase/auth` → ID-Token an `POST /api/auth/google` (Backend verifiziert bereits)
- Auto-Refresh / Session-Restore beim App-Start

### 3.2 Premium (Option A — Web-only Purchase)
- **Kein IAP, kein RevenueCat, kein Stripe in der App**
- App liest nur `user.isPremium` vom Backend und schaltet UI frei
- iOS: **kein** Hinweis auf externe Kaufmöglichkeit (Apple-Compliance)
- Android: dezenter Link zur Website ist erlaubt

### 3.3 Chat
- Socket.IO auf Pfad `/ws` mit JWT-Auth (wie Web)
- Reconnect-Logik + Background-Handling (bei App in Background Verbindung trennen, bei Foreground neu verbinden)
- Foto-/Datei-Upload via `expo-image-picker` + `expo-document-picker` → FormData → bestehender Endpoint
- Premium-Preview-Truncation clientseitig wie im Web

### 3.4 Push Notifications
- **FCM** für beide Plattformen (Android nativ, iOS über Firebase → APNs)
- Client: `expo-notifications` → FCM-Token holen → an Backend registrieren
- Backend wird erweitert (siehe Abschnitt 5)
- Deep-Link bei Tap: Push → öffnet passenden Screen (Chat, Ad-Detail, etc.)

### 3.5 Navigation
- **Bottom-Tabs** (5 Tabs):
  1. **Home / Jobs** (Employer-Jobs oder Candidate-Ads je nach Rolle)
  2. **Search** (Candidates oder Jobs je nach Rolle)
  3. **Chat** (Conversation-Liste)
  4. **Notifications**
  5. **Profile** (Settings, eigene Ads/Jobs, Favoriten, Logout)
- Stack-Navigation für Detail-Screens
- Modals für Auth, Ad-Create/Edit, Filter

### 3.6 i18n
- Alle 5 JSON-Dateien aus `apps/web/src/messages/` werden in `apps/mobile/src/messages/` **symlink-frei kopiert** oder (besser) aus `@jmp/shared` geladen
- Auto-Detection via `expo-localization`
- Manuelles Umschalten in Settings

---

## 4. Monorepo-Struktur (Ziel)

```
job-matching-platform/
├── apps/
│   ├── web/                       # bestehend
│   └── mobile/                    # NEU
│       ├── app/                   # expo-router (file-based)
│       │   ├── (auth)/
│       │   │   ├── login.tsx
│       │   │   ├── register.tsx
│       │   │   └── _layout.tsx
│       │   ├── (tabs)/
│       │   │   ├── index.tsx      # Home/Jobs
│       │   │   ├── search.tsx
│       │   │   ├── chat.tsx
│       │   │   ├── notifications.tsx
│       │   │   ├── profile.tsx
│       │   │   └── _layout.tsx    # Tab-Bar
│       │   ├── jobs/[id].tsx
│       │   ├── candidates/[id].tsx
│       │   ├── chat/[conversationId].tsx
│       │   ├── ads/new.tsx
│       │   ├── ads/[id]/edit.tsx
│       │   ├── legal/
│       │   │   ├── impressum.tsx
│       │   │   ├── agb.tsx
│       │   │   └── datenschutz.tsx
│       │   ├── _layout.tsx        # Root (Providers, Auth-Gate)
│       │   └── +not-found.tsx
│       ├── src/
│       │   ├── lib/
│       │   │   ├── api.ts         # portiert aus web
│       │   │   ├── auth.ts        # mit expo-secure-store
│       │   │   ├── socket.ts
│       │   │   ├── firebase.ts
│       │   │   ├── i18n.ts
│       │   │   ├── push.ts        # expo-notifications
│       │   │   └── upload.ts
│       │   ├── components/        # UI-Components (RN-Variante der Web-Components)
│       │   ├── hooks/
│       │   ├── stores/            # Zustand oder Context
│       │   ├── messages/          # de.json, en.json, fr.json, it.json, sq.json
│       │   └── theme/             # Tailwind-Config, Farben, Fonts (1:1 zu Web)
│       ├── assets/
│       │   ├── icon.png
│       │   ├── splash.png
│       │   ├── adaptive-icon.png
│       │   └── fonts/
│       ├── app.json               # Expo-Config
│       ├── eas.json               # EAS Build-Profile
│       ├── babel.config.js
│       ├── metro.config.js        # Monorepo-Wiring
│       ├── tailwind.config.js
│       ├── tsconfig.json
│       ├── package.json
│       ├── GoogleService-Info.plist   # iOS Firebase (nicht im Git)
│       └── google-services.json       # Android Firebase (nicht im Git)
└── packages/
    ├── shared/                    # wird erweitert (optional)
    └── backend/                   # wird erweitert (Push, siehe 5.)
```

---

## 5. Backend-Erweiterungen (nur für Push)

### 5.1 Neue Dependencies
```bash
cd packages/backend
npm install firebase-admin
```

### 5.2 Prisma-Schema erweitern
```prisma
model DeviceToken {
  id         String   @id @default(cuid())
  userId     String
  token      String   @unique
  platform   String   // 'ios' | 'android'
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model User {
  // ... bestehende Felder
  deviceTokens DeviceToken[]
}
```
Migration: `npx prisma migrate dev --name add_device_tokens`

### 5.3 Neue Dateien
- `packages/backend/src/services/fcm.service.ts` — Wrapper um `firebase-admin` Messaging
- `packages/backend/src/controllers/device-token.controller.ts`
- `packages/backend/src/routes/device-token.routes.ts`

### 5.4 Neue Endpoints
| Methode | Pfad | Zweck |
|---|---|---|
| POST | `/api/notifications/device-token` | Registriert FCM-Token für eingeloggten User |
| DELETE | `/api/notifications/device-token` | Entfernt Token (bei Logout) |

### 5.5 Modifikation von `notification.service.ts`
Überall wo bisher `emitToUser(userId, 'notification:new', data)` aufgerufen wird, zusätzlich:
```ts
await fcmService.sendToUser(userId, { title, body, data });
```

### 5.6 Trigger-Punkte (was löst Push aus)
- Neue Chat-Nachricht → Push an Empfänger
- Neues Match (Job ↔ Ad)
- Neue Ad online (für Employer mit passenden Jobs)
- Favorisierung durch Employer (optional)
- System-Benachrichtigungen
- Profil-Views (optional, Premium-Feature)

### 5.7 Firebase Admin Setup
- Service-Account-JSON aus Firebase Console → **nicht ins Git**
- In `packages/backend/config.env`: `FIREBASE_SERVICE_ACCOUNT_PATH=/secure/path/firebase-admin.json`
- Production: über Docker-Secret oder Env-Var mit JSON-Inhalt

---

## 6. External Setup Checklist

Diese Punkte musst **du** erledigen (ich kann's nicht für dich machen).

### 6.1 Apple Developer (99 €/Jahr) — BLOCKIERT iOS-Build
- [ ] Apple Developer Program Account erstellen
- [ ] App ID in Apple Developer Portal: `com.gjp.app` (mit Push-Capability)
- [ ] APNs Auth Key (.p8) generieren → **download sicher aufbewahren**
- [ ] App Store Connect → neue App anlegen: „GJP – Global Jobs Platform"

### 6.2 Google Play Console (25 $ einmalig) — BLOCKIERT Android-Release
- [ ] Google Play Developer Account
- [ ] App anlegen: `com.gjp.app`
- [ ] SHA-1 Fingerprint nach erstem EAS-Build hinzufügen

### 6.3 Firebase (gratis) — BLOCKIERT Push + Google-Login
- [ ] Im bestehenden Firebase-Projekt **iOS-App** hinzufügen
  - Bundle ID: `com.gjp.app`
  - `GoogleService-Info.plist` downloaden → in `apps/mobile/` ablegen
- [ ] **Android-App** hinzufügen
  - Package Name: `com.gjp.app`
  - `google-services.json` downloaden → in `apps/mobile/` ablegen
  - SHA-1 nach erstem Build nachtragen
- [ ] Cloud Messaging aktivieren
- [ ] APNs Auth Key (.p8) in Firebase Console hochladen (Project Settings → Cloud Messaging → iOS)
- [ ] Service Account JSON generieren → fürs Backend

### 6.4 Expo / EAS (gratis)
- [ ] Account auf expo.dev erstellen
- [ ] `npm install -g eas-cli`
- [ ] `eas login` im Projekt
- [ ] Projekt mit EAS verknüpfen: `eas init`

### 6.5 Lokale Dev-Tools
- [ ] Node.js 20 LTS (vorhanden)
- [ ] Android Studio (für Emulator + SDK) — Linux ✓
- [ ] **Expo Go App** auf iPhone installieren (App Store)
- [ ] **Expo Go App** auf Android (falls Test-Gerät vorhanden)

---

## 7. Milestones

### M0 — Vorbereitung *(bevor M1 startet)*
**Dauer:** nur externe Aktionen
- [ ] Apple Developer Account kaufen
- [ ] Google Play Account kaufen
- [ ] Firebase iOS + Android Apps registrieren (Bundle `com.gjp.app`)
- [ ] `GoogleService-Info.plist` + `google-services.json` liefern
- [ ] Expo-Account erstellen, `eas-cli` installieren

### M1 — Fundament (`apps/mobile` initial)
- Expo SDK 52 Projekt erstellen mit TypeScript + expo-router
- Monorepo-Wiring: `metro.config.js` für Workspace-Support
- NativeWind v4 + Tailwind-Config aus Web übernehmen
- TypeScript `paths` für `@jmp/shared`
- `.env`-Setup: `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_WS_URL`
- API-Client portiert (`src/lib/api.ts`) mit `expo-secure-store`
- Auth-Context + Session-Restore
- Basis-Screens: Login, Register, Splash
- i18n-Setup mit 5 Sprachen (JSON aus Web übernommen)
- **Erfolgs-Kriterium:** App läuft auf iPhone via Expo Go, Login gegen bestehendes Backend funktioniert, Token wird sicher gespeichert

### M2 — Core Features (Jobs, Ads, Favoriten, Profil)
- Bottom-Tab-Navigation mit 5 Tabs
- Job-Listing + Detail + Filter + Suche
- Candidate-/Ads-Listing + Detail + Filter + Suche
- Favoriten (Add/Remove/Liste)
- Profil-Screen mit Settings, eigene Ads/Jobs
- Ad-Create/Edit-Flow inkl. Foto-Upload (`expo-image-picker`)
- Role-based Routing (Employer vs. Job-Seeker)
- Google-Login funktional
- **Erfolgs-Kriterium:** Alle Kern-Flows außer Chat und Push sind nutzbar

### M3 — Chat
- Socket.IO-Client mit JWT-Auth + Reconnect
- Conversation-Liste mit Live-Updates
- Chat-Screen mit Nachrichten-Historie (paginiert)
- Tipp-Indikator + Online-Status
- Datei-Upload (Bilder + Dokumente)
- Premium-Truncation-Logik
- App-Lifecycle: Disconnect bei Background, Reconnect bei Foreground
- **Erfolgs-Kriterium:** Echtzeit-Chat zwischen Web-User und Mobile-User funktioniert 1:1

### M4 — Push Notifications *(Backend + Mobile)*
- **Backend:** `firebase-admin` installieren, Prisma-Migration, `fcm.service.ts`, Device-Token-Endpoints
- **Backend:** FCM-Versand in alle bestehenden Notification-Trigger einbauen
- **Mobile:** `expo-notifications` einbinden, Permission-Flow, Token-Registrierung nach Login
- **Mobile:** Foreground-Handling (Banner), Background-Handling (System-Notification), Tap → Deep-Link
- Testing: Echte Push-Zustellung auf iPhone und Android-Gerät
- **Erfolgs-Kriterium:** Neue Chat-Nachricht löst Push auf Empfänger-Gerät aus, Tap öffnet den Chat

### M5 — Premium-UI + Legal + i18n-Polish
- Premium-Status-Indikator (Badge im Profil)
- Features werden abhängig von `isPremium` freigeschaltet
- Web-Link zum Kauf (nur Android)
- Legal-Screens nativ (Impressum, AGB, Datenschutz) — für Apple-Review Pflicht
- i18n-Switch in Settings
- About, Contact-Screens
- **Erfolgs-Kriterium:** App ist Apple-Review-tauglich (alle Compliance-Punkte erfüllt)

### M6 — Release-Vorbereitung & Store-Einreichung
- App-Icon, Splash-Screen, Adaptive Icon (Android)
- EAS Build-Profile (`development`, `preview`, `production`)
- Erster EAS Production Build iOS + Android
- SHA-1 Fingerprint in Firebase + Play Console nachtragen
- Store-Assets: Screenshots (iPhone 6.7" + iPad + Android), Beschreibung in 5 Sprachen
- **TestFlight** (iOS) + **Play Console Internal Testing** (Android) Upload
- Review-Submission bei Apple + Google
- **Erfolgs-Kriterium:** App ist im App Store + Google Play live

---

## 8. Sicherheit & Compliance

### 8.1 Apple App Store Review Requirements
- [ ] Legal-Seiten (Impressum, Datenschutz, AGB) nativ in App verlinkt
- [ ] Account-Löschung innerhalb der App möglich (seit Juni 2022 Pflicht bei Registrierungs-Apps)
- [ ] Kein Verweis auf Stripe oder externe Zahlungsmöglichkeiten
- [ ] Push nur nach expliziter Permission-Anfrage
- [ ] „Sign in with Apple" als Alternative, wenn Google-Login vorhanden (Guideline 4.8)
- [ ] App Tracking Transparency: Falls Analytics/Tracking → Permission-Dialog

### 8.2 Google Play Store
- [ ] Datenschutzerklärung URL in Play Console hinterlegen
- [ ] Data Safety Form ausfüllen
- [ ] Target API Level mindestens API 34 (Android 14)

### 8.3 Geheime Dateien (NICHT ins Git)
`.gitignore`-Ergänzungen:
```
apps/mobile/GoogleService-Info.plist
apps/mobile/google-services.json
apps/mobile/.env
apps/mobile/.env.*
packages/backend/firebase-admin.json
```

---

## 9. Risiken & offene Punkte

| Risiko | Mitigation |
|---|---|
| Apple verlangt „Sign in with Apple" zusätzlich zu Google | Einbauen in M2, kostet ~1 Tag |
| Native Builds brechen wegen Monorepo-Pfaden | `metro.config.js` sauber konfigurieren, in M1 getestet |
| Push auf iOS erst nach erstem Dev-Build testbar (nicht in Expo Go) | EAS Development Build in M4 verwenden |
| Tailwind-Config aus Web nutzt v4-Features, die NativeWind noch nicht unterstützt | Fallback auf klassische Classes, in M1 verifiziert |
| Deep-Links müssen Apple Associated Domains haben | `apple-app-site-association` auf Backend-Server hosten, in M6 |
| Firebase-Projekt-Billing könnte FCM-Limits haben | Spark-Plan (gratis) reicht für alles, Blaze optional |

---

## 10. Nach dem Release

- Crashlytics / Sentry einbauen
- Analytics (Firebase Analytics oder PostHog)
- OTA Updates über EAS Update (ohne App-Store-Review bei JS-Änderungen)
- Monitoring: Push-Delivery-Rate, Session-Length, Conversion Job → Application
