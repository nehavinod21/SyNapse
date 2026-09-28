# How to Collect Poster Metrics for SyNAPSE

## Prerequisites

Open **two terminals**:

**Terminal 1 — Backend**
```powershell
cd synapse\backend
.\.venv\Scripts\Activate.ps1
uvicorn main:app --host 0.0.0.0 --port 8000
```

**Terminal 2 — Frontend (for manual WebSocket test)**
```powershell
cd synapse\frontend
npm run dev
```

Demo login: `teacher` / `demo1234` (also `student`, `sendofficer`, `caregiver`)

---

## Option A — Automatic (recommended)

```powershell
cd synapse\backend
.\.venv\Scripts\Activate.ps1
python benchmark_poster_metrics.py
```

This creates:
- `backend/poster_metrics.json` — full results
- `backend/poster_metrics.csv` — paste into Excel/Google Sheets for your poster

> First emotion run may be slow (DeepFace downloads model weights once).

---

## Option B — Manual (browser DevTools)

### 1. Emotion detection latency

1. Open http://localhost:5173 → login as **student** (`demo1234`)
2. Go to **AAC session** (needs webcam; or use teacher flow)
3. Press **F12** → **Network** tab → filter `detect`
4. Click **Update mood** 10 times
5. Click each `detect` row → **Timing** tab → note **Duration**
6. **Average** the 10 values → your poster number (e.g. `1.24 s`)

**API directly (alternative):**
- Network → find any authenticated request → copy `Authorization: Bearer ...`
- Use Postman or curl:
```powershell
curl -X POST http://localhost:8000/api/emotion/detect `
  -H "Authorization: Bearer YOUR_TOKEN" `
  -F "session_id=YOUR_SESSION_ID" `
  -F "file=@benchmark_test_face.jpg"
```

---

### 2. AAC card generation latency (LLM on vs off)

**With Ollama (LLM):**
```powershell
ollama pull llama3
ollama serve
```
Then benchmark — response `"source": "llm"` in Network tab on `cards/generate`.

**Without Ollama (rule fallback):**
Stop Ollama — response `"source": "rule_based"` (faster).

Steps:
1. F12 → Network → filter `generate`
2. Trigger card reload (change emotion or refresh session)
3. Record 10 durations from `POST /api/cards/generate`
4. Note **card count** in Response → `cards.length` (should be **16**)

---

### 3. WebSocket update delay

1. Login **teacher** → **Sessions** → open **Live session** for an active session
2. F12 → **Network** → **WS** → click the websocket connection
3. In another window login **student** → same child session → **Update mood**
4. In WS **Messages** tab, note timestamp of `emotion_detected` event
5. Compare to Network time of `detect` request
6. **Difference** = WebSocket delay (typically 100–500 ms local)

---

### 4. PDF report generation

1. Login as **teacher**
2. F12 → Network → filter `generate-pdf`
3. Open a child with session history → **Generate report** / reports hub
4. Or call API:
```powershell
curl -X POST "http://localhost:8000/api/reports/session/SESSION_ID/generate-pdf?language=en" `
  -H "Authorization: Bearer TOKEN" `
  -o report.pdf
```
5. Record **Duration** (3 runs, average)

---

### 5. Static numbers (no timing needed)

| Metric | Value | Where in code |
|--------|-------|---------------|
| Emotion classes | **7** | `deepface_service.py` — happy, sad, angry, fear, disgust, surprise, neutral |
| AAC board size | **16** | `cards_service.py` → `get_cards()` returns `cards[:16]` |
| Roles | **4** | `App.jsx` — student, teacher, send_officer, caregiver |
| Assessment phases | **6** | `models.py` Session.phase; assessment `phase_notes` keys 1–6 |
| Languages | **2** | `label` + `label_ar` on every AAC card |
| SDGs | **3, 4, 10** | README / project alignment |

---

### 6. Database counts (for bar charts)

```powershell
cd synapse\backend
python -c "
import sqlite3
c=sqlite3.connect('synapse.db')
for t in ['sessions','emotion_logs','card_selections','assessments','children']:
    print(t, c.execute(f'SELECT COUNT(*) FROM {t}').fetchone()[0])
"
```

Use these for "Sessions logged", "Cards selected", etc. on your poster.

---

## Spreadsheet template

| Metric | Value | Unit | Method |
|--------|-------|------|--------|
| Emotion detection (mean) | | s | 10× POST /api/emotion/detect |
| AAC generate — LLM (mean) | | s | Ollama on, source=llm |
| AAC generate — rules (mean) | | s | Ollama off, source=rule_based |
| WebSocket delay | | ms | detect → WS message |
| PDF report (mean) | | s | POST generate-pdf |
| Emotion classes | 7 | | fixed |
| AAC cards per board | 16 | | fixed |
| Roles | 4 | | fixed |
| Assessment phases | 6 | | fixed |
| Languages | 2 | | fixed |
| SDGs | 3, 4, 10 | | fixed |
| Sessions in DB | | | sqlite count |
| Emotion logs in DB | | | sqlite count |

Copy values from `poster_metrics.csv` after running the benchmark script.
