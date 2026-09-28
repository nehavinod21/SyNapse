#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

echo "Starting Ollama + API (Docker) — run frontend in another terminal: cd frontend && npm install && npm run dev"
docker compose up -d ollama backend

echo "API: http://localhost:8000/docs"
echo "Pull a model once: docker exec -it \$(docker compose ps -q ollama) ollama pull llama3"
