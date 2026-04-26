# Biased Trait Auditor — Demo API

Static results viewer. Serves precomputed `results/<run>/{det1,det2,consensus}.json`
to the Next.js frontend.

## Setup

```bash
# from project root
/home/bosco/venv/bin/pip install -r demo/api/requirements.txt
```

## Run

```bash
cd /home/bosco/hackathon/trait_detector/demo/api
/home/bosco/venv/bin/uvicorn main:app --port 8000 --reload
```

Server binds to `http://0.0.0.0:8000`. CORS allows `http://localhost:3000`,
`http://127.0.0.1:3000`, `http://0.0.0.0:3000` (the Next.js dev origin).

## Endpoints

Base URL: `http://localhost:8000/api`

| Method | Path | Body | Response |
|---|---|---|---|
| GET | `/health` | — | `{"status":"ok"}` |
| GET | `/runs` | — | `{"runs":[{name, ft_path, base_path, infectedness, verdict_label, judge_model}, ...]}` |
| GET | `/runs/{run}/det1` | — | `det1.json` (FileResponse, ~5MB) |
| GET | `/runs/{run}/det2` | — | `det2.json` (FileResponse) |
| GET | `/runs/{run}/consensus` | — | `consensus.json` (FileResponse) |
| POST | `/runs/{run}/audit` | — | `{"status":"ready","redirect":"/audit/{run}/d1"}` after ~1.5s sleep |

`/runs` auto-scans `<project_root>/results/` and lists every subdirectory
that contains `consensus.json`. `infectedness` and `verdict_label` come from
`consensus.json::infectedness.{infectedness, verdict}`. Config metadata
(`ft_path`, `base_path`, `judge_model`) is pulled from `det2.json::config`
with fallback to `det1.json::config`.

## Smoke test

```bash
curl -s localhost:8000/api/health
curl -s localhost:8000/api/runs | python -m json.tool
curl -s localhost:8000/api/runs/m_ft/consensus \
  | python -c "import json,sys; d=json.load(sys.stdin); print(d['infectedness'])"
curl -s -X POST localhost:8000/api/runs/m_ft/audit
```

## Notes

- This is a static viewer. `POST /audit` is a stub — it does not run anything.
- Path traversal on `{run_name}` is rejected (slashes / leading dots / escaping `results/`).
- 5MB JSON files are served via `FileResponse` (streamed from disk; not reparsed per request).
