#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ -f .env.local ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env.local
  set +a
fi

export INTERVALS_ICU_ATHLETE_ID="${INTERVALS_ICU_ATHLETE_ID:-i478692}"

if [[ -z "${INTERVALS_ICU_API_KEY:-}" ]]; then
  echo "AERION: INTERVALS_ICU_API_KEY is not set. Starting with fixture/manual fallback."
  echo "Create .env.local from .env.example to enable live opening sync."
else
  echo "AERION: Intervals key detected for athlete ${INTERVALS_ICU_ATHLETE_ID}. Starting live opening sync."
fi

npm run dev
