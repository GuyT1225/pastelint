# PasteLint — Base44 run notes

## What this project is
A **static, browser-only** text-preparation suite. Pure HTML/CSS/JS — no build step, no backend, no package.json, no server-side code. All processing happens client-side in `js/*.js`.

## How it runs here
Served by `nginx:alpine` via `docker-compose.base44.yml`, bind-mounting the repo root (read-only) at `/usr/share/nginx/html`, exposed on host port **3000**.

- No live-reload dev server needed: static files. A browser refresh picks up edits.
- If the container returns **403 Forbidden**, the repo root dir perms are too tight — run `chmod 755 .` (nginx's non-root worker cannot traverse a `700` root).

## Entry point
`index.html` is the main tool landing page. Other pages (`second-draft.html`, `SSML_builder.html`, etc.) are standalone tools linked from it.

## Verification
- `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/` → 200
- `curl -s -o /dev/null -w "%{http_code}" -H "Host: external-preview.example.com" http://localhost:3000/` → 200 (external Host accepted; nginx allows all hosts)

## Secrets
None. The app is fully client-side and needs no external credentials.

## Tests (optional, not required to run the preview)
Node-based validation scripts in `scripts/` and regression tests in `tests/` can be run with `node` if a Node runtime is available, but they are not part of serving the site.
