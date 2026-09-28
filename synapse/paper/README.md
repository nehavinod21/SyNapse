# SyNAPSE ICAMAC 2026 Paper

IEEE two-column conference draft for **3rd ICAMAC** (max 6 pages).

## Files

| File | Purpose |
|------|---------|
| `icamac2026_synapse.tex` | Full manuscript (`IEEEtran` conference class) |
| `../tests/evaluation/results/*.csv` | Verified benchmark numbers cited in Section V |

## Build PDF (Windows)

1. Install [MiKTeX](https://miktex.org/) or TeX Live.
2. From this folder:

```powershell
pdflatex icamac2026_synapse.tex
pdflatex icamac2026_synapse.tex
```

3. Open `icamac2026_synapse.pdf` and confirm **≤ 6 pages** in two-column layout.

## Before CMT submission

1. Replace `[Author One]`, `[Author Two]`, and emails in the `.tex` file.
2. Add ICAMAC copyright footer on page 1 (see author kit).
3. Run **IEEE PDF eXpress** with the conference ID from ICAMAC.
4. Declare AI assistance in the submission form.
5. Do **not** add emotion classification accuracy until fixtures are fixed.

## Claims checklist (verified Aug 30, 2026)

- LLM: mean 9.03 s, median 4.02 s, max 54.10 s (n=36)
- PDF: mean 0.053 s, median 0.052 s (n=30)
- WebSocket: median 0.183 s (n=30)
- Fallback: 26.7% malformed JSON (32/120)
- RBAC: 94.1% (158/168) with corrected failure taxonomy
- Emotion pilot: 0/12 — diagnostic only, not reported as accuracy
