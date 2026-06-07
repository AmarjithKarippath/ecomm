#!/bin/sh
# Container entrypoint: run pending migrations, then start the API.
# Failing migrations should abort startup so a broken schema is loud and obvious.
set -e

echo "[entrypoint] alembic upgrade head"
alembic upgrade head

echo "[entrypoint] starting uvicorn"
exec "$@"
