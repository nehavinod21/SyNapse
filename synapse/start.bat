@echo off
setlocal
cd /d "%~dp0"
echo Starting Ollama + API (Docker). Run frontend separately: cd frontend ^&^& npm install ^&^& npm run dev
docker compose up -d ollama backend
echo API: http://localhost:8000/docs
echo Pull model once: docker compose exec ollama ollama pull llama3
endlocal
