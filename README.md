# Launchpad Cloud — SDE Prep Tracker

A React + TypeScript + Firebase Authentication + Cloud Firestore app for the 42-day SDE interview roadmap. Progress is tied to the signed-in user's Firebase UID and syncs through Firestore across browsers/devices.

## Features
- Email/password sign-up and sign-in
- Private user-specific Firestore data
- Dashboard, 42-day roadmap, daily checklist, DSA tracker, daily journal, weekly reviews
- Search and status filters for roadmap and DSA
- JSON backup export and import (optional; not required for normal syncing)
- Responsive layout
- Firestore security rules scoped to each user's UID

## 1. Prerequisites
- Node.js 20+ (recommended)
- A Google account
- A Firebase project

## 2. Configure Firebase
1. Open https://console.firebase.google.com/ and create a Firebase project (or select a project you control).
2. In Project settings → General → Your apps, add a **Web app**.
3. Copy the Firebase web configuration.
4. Copy `.env.example` to `.env` and fill in each `VITE_FIREBASE_*` value.
5. In Firebase Console → Authentication → Sign-in method, enable **Email/Password**.
6. In Firestore Database, create a database. Start in production mode.
7. Open Firestore → Rules, paste the contents of `firestore.rules`, and publish.
8. Authentication → Settings → Authorized domains: add the domain where you will host the app when deploying.

Do not put service-account JSON, private keys, or Admin SDK credentials in this frontend project. The Firebase web config is expected to be present in a browser app; access is protected by Authentication and Firestore Rules.

## 3. Run locally
```bash
npm install
npm run dev
```
Open the local URL printed by Vite. Sign up with an email and password. Your data is stored in Firestore under `users/{your-uid}/...`.

For a production build:
```bash
npm run build
npm run preview
```

## 4. Deploy
You can deploy the `dist/` folder to Firebase Hosting, Netlify, or Vercel.
For Firebase Hosting, install the Firebase CLI (`npm install -g firebase-tools`), run `firebase login`, then `firebase init hosting`, select the existing project, set the public directory to `dist`, configure it as a single-page app, and run `npm run build && firebase deploy`.

For Netlify/Vercel, add the six environment variables from `.env` to the hosting provider's environment settings before building.

## Data model
- `users/{uid}/app/state`: roadmap statuses, daily checklists, journal entries, reviews, and custom DSA problems.
- `users/{uid}/app/profile`: display name and preferences.

Every Firestore request is scoped to the current Firebase user. Do not loosen Firestore rules to public read/write.

## Notes
- This repo is generated as a ready-to-configure project. It cannot connect to your Firebase project until you provide its web-app config and publish the Firestore rules.
- Cloud sync requires internet access. Once configured, the same account can be used on multiple devices.
- JSON export/import is retained as an optional backup, not the primary persistence mechanism.
