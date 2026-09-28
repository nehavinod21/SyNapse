# SyNAPSE

Emotion-aware AAC (Augmentative and Alternative Communication) web platform for minimally verbal neurodiverse children, aligned with a UAE / KHDA-aware reporting workflow. Developed as a **local-first**, **free and open-source** stack: **FastAPI + SQLite + DeepFace + Ollama (Llama 3.x)** on the backend, and **React + Vite + Tailwind** on the frontend.

## Architecture

- **Backend** (`backend/`): REST API, JWT auth, SQLAlchemy models, PDF reports (ReportLab), WebSocket channels per session (`/ws/session/{session_id}`), emotion detection via DeepFace, optional LLM card suggestions via Ollama.
- **Frontend** (`frontend/`): Role-based UI for **Student**, **Teacher**, **SEND Officer**, and **Caregiver**; bilingual (English / Arabic) labels for AAC cards; live emotion updates over WebSockets where applicable.
- **Data**: SQLite file `backend/synapse.db` (created on startup). Seeded demo users and rich session history when the database is empty.

## Prerequisites

- Python **3.11+**
- Node **18+**
- Docker (optional, for Ollama + containerized API)
- Webcam (optional, for live emotion capture in the student AAC flow)

## Quick start (local)

### 1. Backend

```bash
cd backend
python -m venv .venv
. .venv/Scripts/activate   # Windows
# source .venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

API docs: `http://localhost:8000/docs`

Environment (optional):

- `OLLAMA_BASE_URL` — default `http://localhost:11434`
- `OLLAMA_MODEL` — default `llama3`

### 2. Ollama (LLM)

Install [Ollama](https://ollama.com/) and pull a model:

```bash
ollama pull llama3
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

App: `http://localhost:5173`

Optional: `VITE_API_URL=http://localhost:8000` (this is the default in `src/api/axios.js`).

## Docker Compose

From the `synapse/` folder:

```bash
docker compose up -d
```

This starts **Ollama** and the **backend** with `OLLAMA_BASE_URL=http://ollama:11434`. Run the **frontend** with `npm run dev` on the host (see Quick start).

Helper scripts: `start.sh` / `start.bat`.

## Demo accounts (seeded)

Password for all: **`demo1234`**

| Username      | Role          |
|---------------|---------------|
| `teacher`     | Teacher       |
| `teacher2`    | Teacher       |
| `sendofficer` | SEND officer  |
| `caregiver`   | Caregiver     |
| `student`     | Student (linked to demo child profile) |

## UAE / MAHE Dubai context

Reports include placeholders and wording suitable for **school SEND workflows** and **UAE / KHDA-style** summaries. Always have qualified professionals review outputs before formal submission.

## License

Use and modify for educational and research purposes in line with your institution’s policies.
