# Deploy SyNAPSE on iPad (Wi‑Fi or Vercel)

SyNAPSE has two parts: **React frontend** (iPad UI) and **FastAPI backend** (API, database, emotion AI). The iPad only runs the browser/PWA — the backend must run on your PC or in the cloud.

---

## Option A — Same Wi‑Fi (best for demos / viva)

Use this when your iPad and Windows PC are on the **same Wi‑Fi**.

### 1. Find your PC IP

PowerShell:

```powershell
ipconfig
```

Use the **Wi‑Fi** IPv4 address (e.g. `192.168.1.73`).  
**Do not** use `192.168.56.1` — that is VirtualBox, not your LAN.

### 2. Allow through Windows Firewall (once)

```powershell
netsh advfirewall firewall add rule name="SyNAPSE API" dir=in action=allow protocol=TCP localport=8000
netsh advfirewall firewall add rule name="SyNAPSE Web 5180" dir=in action=allow protocol=TCP localport=5180
```

### 3. Configure frontend for LAN

```powershell
cd synapse\frontend
copy .env.example .env.local
```

Edit `.env.local` (no spaces in the URL):

```env
VITE_API_URL=http://192.168.1.73:8000
```

Replace with your real Wi‑Fi IP.

### 4. Start backend (from `synapse\backend`)

```powershell
cd synapse\backend
.\.venv\Scripts\uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Wait until you see `Application startup complete`.

### 5. Start frontend for iPad — use production build (recommended)

**Important:** `npm run dev:lan` is very slow on iPad (thousands of tiny JS files over Wi‑Fi).  
Use the production build instead:

```powershell
cd synapse\frontend
npm run ipad:lan
```

This runs `npm run build` then serves the optimized app at `http://YOUR_PC_IP:5173`.

Terminal shows: `Network: http://192.168.1.73:5173/`

**After changing `.env.local`**, run `npm run ipad:lan` again (rebuild required).

#### Optional: dev mode on iPad (slower)

Only for active development on iPad:

```powershell
npm run dev:lan
```

HMR is disabled automatically for `dev:lan` to reduce Wi‑Fi issues.

### 6. Open on iPad

1. Safari → `http://192.168.1.73:5180/login` (use your PC IP — port **5180**)
2. Login: `student` / `demo1234` (or other demo users)
3. **Add to Home Screen** (Share → Add to Home Screen) for an app-like icon

If login shows a red **“Cannot reach the API”** banner, the backend is not reachable — check firewall, IP, and that `VITE_API_URL` matches.

### Camera / emotion on iPad (HTTPS required)

**iOS blocks the camera on plain HTTP** (`http://192.168.x.x`). This is an Apple rule, not a SyNAPSE bug.

On HTTP you will see a yellow notice in the AAC session — **cards still work**, but live mood detection does not.

**To enable camera on iPad**, use HTTPS tunnels (free):

1. Install [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/) (or ngrok).

2. Start backend + frontend as usual (`5180` + `8000`).

3. **Terminal A** — expose API:
   ```powershell
   cloudflared tunnel --url http://127.0.0.1:8000
   ```
   Copy the `https://….trycloudflare.com` URL → set in `.env.local`:
   ```env
   VITE_API_URL=https://YOUR-API-URL.trycloudflare.com
   ```

4. Rebuild frontend:
   ```powershell
   cd synapse\frontend
   npm run ipad:lan
   ```

5. **Terminal B** — expose web app:
   ```powershell
   cloudflared tunnel --url http://127.0.0.1:5180
   ```

6. On iPad Safari, open the **frontend** `https://….trycloudflare.com` URL (not the LAN IP).

7. Safari → allow camera when prompted.

### Option A2 — Wi‑Fi + HTTPS (camera works) — ngrok alternative

Use [ngrok](https://ngrok.com/) or Cloudflare Tunnel:

```powershell
# Terminal 1 — backend
uvicorn main:app --host 0.0.0.0 --port 8000

# Terminal 2 — expose API
ngrok http 8000
```

Set `.env.local` to the ngrok **https** URL, run `npm run ipad:lan`, then open the ngrok **frontend** URL (or tunnel port 5173 too).

---

## Option B — Vercel (frontend) + cloud/tunnel (backend)

**Vercel hosts only the static React app.** It cannot run FastAPI + SQLite + DeepFace.

### B1 — Frontend on Vercel

1. Push project to GitHub.
2. [vercel.com](https://vercel.com) → New Project → import repo.
3. **Root directory:** `synapse/frontend`
4. **Build command:** `npm run build`
5. **Output:** `dist`
6. **Environment variable:**
   - `VITE_API_URL` = your public backend URL (see B2)

`vercel.json` is already included for React Router.

### B2 — Backend (pick one)

| Host | Notes |
|------|--------|
| **PC + ngrok** | Easiest for thesis; PC must stay on |
| **Render / Railway** | Free tier; DeepFace install is slow/heavy |
| **Same Wi‑Fi** | Use Option A instead |

After backend is public, set in Vercel:

```
VITE_API_URL=https://your-api.example.com
```

Redeploy Vercel. Open your `*.vercel.app` URL on iPad.

### B3 — CORS

Backend already allows `*.vercel.app` and local Wi‑Fi IPs. If you use a custom domain, add it to `allow_origins` in `backend/main.py`.

---

## Quick comparison

| Method | iPad access | Speed on iPad | Camera | PC must stay on? |
|--------|-------------|---------------|--------|------------------|
| Wi‑Fi `ipad:lan` (recommended) | `http://PC_IP:5173` | Fast | Often blocked (HTTP) | Yes |
| Wi‑Fi `dev:lan` | `http://PC_IP:5173` | **Very slow** | Often blocked | Yes |
| Wi‑Fi + ngrok HTTPS | `https://….ngrok…` | Fast | Usually works | Yes |
| Vercel + ngrok API | `https://….vercel.app` | Fast | If API is HTTPS | API PC on (or cloud) |

---

## Demo logins

Password: **`demo1234`**

| User | Role |
|------|------|
| `student` | Student AAC |
| `teacher` | Teacher dashboard |
| `sendofficer` | SEND officer |
| `caregiver` | Caregiver |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| iPad can’t connect | Same Wi‑Fi? Firewall rules? Use PC Wi‑Fi IP not `localhost` or `192.168.56.1` |
| Page loads forever | Use `npm run ipad:lan` instead of `dev:lan` |
| Login fails / red API banner | Backend running? `VITE_API_URL=http://YOUR_IP:8000` with no spaces; rebuild after `.env` change |
| CORS error | Backend running with `--host 0.0.0.0`; IP in CORS regex |
| Camera blocked on iPad | Use HTTPS (ngrok) or demo without camera |
| Vercel blank page | Root dir = `frontend`, env `VITE_API_URL` set, redeploy |
| Changed `.env.local` but iPad still wrong | Run `npm run ipad:lan` again — Vite bakes env at build time |
