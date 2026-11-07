#!/usr/bin/env bash
# 1時間ごとの自動更新で使う: サーバーを起動 → 最新データを書き出し → 壊れていないか確認
# 成功すると dist-artifact/publish-files.json に公開するファイルの一覧ができる
set -euo pipefail
cd "$(dirname "$0")/.."
[ -d node_modules ] || npm ci --no-audit --no-fund
export NODE_USE_ENV_PROXY=1 NODE_NO_WARNINGS=1
export PORT="${PORT:-3123}"
node server.mjs > server.log 2>&1 &
SERVER_PID=$!
trap 'kill $SERVER_PID 2>/dev/null || true' EXIT
for i in $(seq 1 60); do curl -sf "http://localhost:$PORT/" > /dev/null && break; sleep 1; done
WM_SERVER="http://localhost:$PORT" node scripts/build-artifact.mjs
node scripts/check-artifact.mjs
