# IEEE evaluation benchmarks

Run from this directory using the backend virtualenv:

```powershell
cd synapse\tests\evaluation
..\..\backend\.venv\Scripts\python prepare_fixtures.py   # real FER2013 faces (network)
..\..\backend\.venv\Scripts\python bench_pdf_generation.py
# ...repeat for each bench_*.py script
```

Outputs land in `results/`.

## Known diagnostics (fixed in scripts)

- **Role access matrix**: prior 54% score was a **test bug** (empty POST bodies → 422 counted as auth failure; wrong expected access for `/api/alerts`). Fixed scoring treats 422/404 as auth-passed; sends minimal valid payloads.
- **Functional coverage**: `has_test=False` for all endpoints because **no `test_*.py` files exist** under `synapse/tests/` or `synapse/backend/` (only evaluation scripts). The CSV `notes` column states this explicitly.
- **Emotion accuracy**: legacy synthetic ellipse fixtures caused false 0/12 sad-bias. Fixtures are real FER-2013 48x48 crops from HuggingFace `gulsunnciftci/fer2013` (local hub cache). Rebuild balanced pilot: `python expand_fer_fixtures.py --per-class 20` then `python bench_emotion_detection_accuracy.py`.
- **Latest emotion pilot (2026-09-07, CORRECT eval)**: fixtures from FER-2013 **held-out `test` split** (not train). Rebuild: `python expand_fer_fixtures.py --total 5000 --split test` then `python bench_emotion_detection_accuracy.py`.
  - **n=5000**, distribution: angry 821, disgust 109, fear/happy/neutral 820, sad 819, surprise 791 (disgust rare in test; shortfall redistributed).
  - **Top-1 accuracy 2367/5000 = 47.3%**, **macro-F1 0.445**.
  - Prior **train-split** n=5000 run (62.4%) is **obsolete for the paper** — DeepFace emotion models are commonly FER-trained; test-split reporting avoids train-contamination critique.
  - Keep FER demoted in abstract; core claim remains RBAC audit.
- **RBAC**: **168/168 (100%)** after fixes in `reports_router.py` and `teacher_router.py` (verified in `role_access_matrix.csv`).
- **pytest**: `backend/tests/` — **13 tests** (`test_auth.py`, `test_rbac.py`, `test_emotion_pipeline.py`).
- **Endpoints**: **44 REST** + **2 WebSockets** = 46 rows in `functional_test_coverage.csv`.
- Do **not** headline emotion accuracy in the abstract; core paper claim remains the RBAC audit.
- **LLM latency**: `bench_llm_card_generation.py` logs `cpu_percent` and `memory_mb` per run for bimodal slowdown analysis.

Prerequisites: backend venv, Ollama (`llama3.2:3b`) for LLM benches, TensorFlow/DeepFace for emotion benches.
