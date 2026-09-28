# SyNAPSE Deployment Guide

## Option A — School WiFi (Fully Local, Zero Cost, Best Privacy)
1. Run backend on classroom laptop: cd backend && uvicorn main:app --host 0.0.0.0 --port 8000
2. Find laptop IP: run `ipconfig` (Windows) or `ifconfig` (Mac) — look for IPv4 address e.g. 192.168.1.45
3. Update capacitor.config.ts → server.url to http://192.168.1.45:8000
4. Rebuild: npm run build && npx cap sync android
5. Rebuild APK in Android Studio
6. Sideload APK on each tablet:
   - Enable: Settings → Security → Install Unknown Apps
   - Transfer APK via USB or Google Drive
   - Tap APK to install

## Option B — Cloud (Render backend + Vercel frontend)
1. Push entire project to GitHub
2. Backend: go to render.com → New Web Service → connect repo → root dir: backend/ → deploy
3. Frontend: go to vercel.com → Import repo → root dir: frontend/ → build cmd: npm run build → output: dist → deploy
4. After Render deploys, copy the URL (e.g. https://synapse-backend.onrender.com)
5. Update capacitor.config.ts → server.url to the Render URL
6. Rebuild APK

## Install PWA on tablet (no APK needed)
1. Open Chrome on the tablet
2. Go to the Vercel URL
3. Tap the 3-dot menu → "Add to Home Screen"
4. SyNAPSE installs like a native app
