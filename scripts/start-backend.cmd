@echo off
REM Bring the self-hosted CodeLock stack up.
REM
REM The desktop app spawns this when it opens and the API is not already
REM answering (see apps/desktop/src/backend.ts). It must be safe to run twice:
REM `docker compose up -d` is idempotent, so a second window does nothing.
REM
REM Secrets live in apps/api/.env, which compose interpolates. Keep --env-file
REM in step with that path or JWT_* interpolation fails and nothing starts.
cd /d "%~dp0.."
docker compose --env-file apps/api/.env up -d
