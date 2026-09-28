#!/usr/bin/env python3

"""Enumerate FastAPI routes vs existing automated tests."""

from __future__ import annotations



import subprocess

import sys

from pathlib import Path



from _common import EVAL_DIR, BACKEND_DIR, META_PATHS, bootstrap_backend, ensure_results, iter_http_routes, write_csv



OUT = ensure_results() / "functional_test_coverage.csv"

FIELDS = [

    "endpoint_path",

    "http_method",

    "router_module",

    "has_test",

    "test_passed",

    "test_file",

    "notes",

]

TEST_ROOTS = [EVAL_DIR.parent, BACKEND_DIR]





def discover_tests() -> tuple[dict[str, str], list[str]]:

    mapping: dict[str, str] = {}

    files: list[str] = []

    for root in TEST_ROOTS:

        if not root.exists():

            continue

        for path in root.rglob("test_*.py"):

            if "evaluation" in path.parts or ".venv" in path.parts:

                continue

            files.append(str(path))

            text = path.read_text(encoding="utf-8", errors="ignore")

            for line in text.splitlines():

                for token in ("/api/", "/auth/", "/teacher/", "/send/", "/health", "/ws/"):

                    if token in line:

                        frag = line.split('"')[1] if '"' in line else ""

                        if frag.startswith("/"):

                            mapping.setdefault(frag, str(path.relative_to(root)))

    return mapping, files





def main() -> None:

    bootstrap_backend()

    tests, test_files = discover_tests()

    note = (

        "no project test_*.py files found under tests/ or backend/"

        if not test_files

        else f"{len(test_files)} test file(s) discovered"

    )

    rows = []

    for path, methods, mod, _endpoint, kind in iter_http_routes():

        if path in META_PATHS:

            continue

        for method in methods:

            if method == "HEAD":

                continue

            hit = next((k for k in tests if k in path or path.startswith(k.rstrip("/"))), None)

            passed = False

            test_file = tests.get(hit, "") if hit else ""

            if test_file:

                root = next(r for r in TEST_ROOTS if (r / test_file).exists())

                proc = subprocess.run(

                    [sys.executable, "-m", "pytest", str(root / test_file), "-q"],

                    capture_output=True,

                    text=True,

                )

                passed = proc.returncode == 0

            rows.append(

                {

                    "endpoint_path": path,

                    "http_method": method,

                    "router_module": mod,

                    "has_test": bool(test_file),

                    "test_passed": passed,

                    "test_file": test_file,

                    "notes": "" if test_file else note,

                }

            )

    n = write_csv(OUT, FIELDS, rows)

    covered = sum(1 for r in rows if r["has_test"])

    print(f"Wrote {n} rows ({covered}/{n} endpoints have tests; {note}) -> {OUT}")





if __name__ == "__main__":

    main()

