
<!--
This file is generated to help AI coding agents (Copilot/GPT-powered bots) be productive in this repository.
It was created because no existing agent docs were detected. Please edit to add project-specific commands if anything below is incorrect.
-->

# Copilot / AI agent instructions (short and actionable)

Summary
- This project currently has no top-level README or agent docs. Use the heuristics below to find code and learn the project's structure.

What to do first
- Look for these files in the repository root (in order): `README.md`, `package.json`, `pyproject.toml`, `go.mod`, `Dockerfile`, `Makefile`.
- If none exist, list top-level directories and open `src/`, `app/`, `cmd/`, or `server/` to find entry points.

Big-picture architecture hints
- If you find `package.json` or `pyproject.toml`, this is likely a single-repo application. Follow `scripts` in `package.json` or the `setup`/`tool.poetry.scripts` section.
- If you find multiple service folders (for example `frontend/`, `backend/`, `services/*`), treat the repo as a polyrepo-style monorepo. Identify service boundaries by the presence of their own manifest files (`package.json`, `go.mod`, etc.).

Developer workflows & commands
- Run tests where manifests exist:
  - Node: `npm test` or `pnpm test` in the package folder.
  - Python: `pytest` in the virtualenv using `python -m venv .venv; .\.venv\Scripts\Activate.ps1; pip install -r requirements.txt`.
  - If a `Makefile` or `Dockerfile` exists, inspect `make test` or `docker-compose` targets.
- If you are an AI agent making changes, prefer minimal, targeted edits and add or update tests in the same commit.

Project conventions and patterns to look for
- Configuration: search for `.env`, `config/`, or `settings.py`. The repo often uses environment variables; prefer reading `config/*.example` files when present.
- Logging: locate `logger` or `src/logging` to match formatting. Keep new logs consistent with existing sinks (console, file, or structured JSON).
- Database: find `migrations/`, `schema/`, or `prisma/` — mirror the project's migration approach when suggesting DB changes.

Integration points
- External services are typically referenced via environment variables like `DATABASE_URL`, `REDIS_URL`, `SENTRY_DSN`. When adding integration code, use these env var names if present.
- If `docker-compose.yml` or `k8s/` directory exists, follow service names from those manifests.

Patterns specific to this repo (detectable examples)
- If you find `src/index.ts` or `server.ts`, treat that file as the primary backend entrypoint and look for `app.listen` or equivalent.
- If you find `src/main.py` or `app.py`, look for `if __name__ == "__main__"` to understand runtime behavior.

How to propose changes
- Keep pull requests small and focused. Include a short description and a test or a small smoke-check where possible.
- If you add a dependency, update the lockfile or manifest in the same commit (e.g., `package.json` + `package-lock.json` / `poetry.lock` / `requirements.txt`).

Examples (search paths to inspect first)
- `README.md` — project overview and run instructions
- `package.json` / `pyproject.toml` / `go.mod` — language-specific build/test commands
- `Dockerfile`, `docker-compose.yml`, `k8s/` — container and deployment
- `src/`, `app/`, `services/`, `cmd/` — code entry points and service boundaries

If you see tests failing or CI config
- Open `.github/workflows/` to inspect CI steps and match their environment in local runs.
- Re-run and fix only the failing tests relevant to your change; avoid broad refactors in the same PR.

When in doubt
- Ask for the top-level README or a short maintainer note. If unavailable, create a small `MAINTAINER_NOTES.md` with assumptions and how you tested your change.

Minimal agent rules
- Do not introduce large refactors without maintainer approval.
- Run existing unit tests in the affected package and include test updates in the same PR.
- Preserve existing code style; prefer local style over adding a formatter unless already present.

Please review and edit this file to add repo-specific commands and examples (build/test/run) if you have them.
