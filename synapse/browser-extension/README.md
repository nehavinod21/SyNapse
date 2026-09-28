# SyNAPSE Browser Extension

Keeps **6-minute background emotion checks** running while the SyNAPSE web app is open in Chrome/Edge.

## Install (developer mode)

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. **Load unpacked** → select this `browser-extension` folder
4. Open SyNAPSE student AAC session with camera permission

## How it works

- `background.js` — Chrome alarm every **6 minutes**
- `content.js` — sends `SYNAPSE_MONITOR_TICK` to the page
- SyNAPSE `useEmotionMonitor` hook captures webcam + calls `/api/emotion/detect`
- Cautious emotions → instant alert to **teacher** (classroom) or **caregiver** (home)

## Note

The extension cannot access the camera when no SyNAPSE tab is open. For all-day school use, keep the student session tab active or use the tablet APK/PWA.
