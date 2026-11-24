#!/usr/bin/env bash
# Build the static site and sync it to the directory Caddy serves as blog.qijun.io.
# Usage: ./scripts/deploy.sh
#   DEPLOY_SERVER: SSH host or alias, default i
#   DEPLOY_DIR:    remote web root, default /root/apps/qj-blog

set -euo pipefail

SERVER="${DEPLOY_SERVER:-i}"
REMOTE_DIR="${DEPLOY_DIR:-/root/apps/qj-blog}"

cd "$(dirname "${BASH_SOURCE[0]}")/.."

echo "==> Build apps/web"
pnpm install --frozen-lockfile
pnpm --filter web build

echo "==> Sync apps/web/dist to $SERVER:$REMOTE_DIR"
rsync -az --delete apps/web/dist/ "$SERVER:$REMOTE_DIR/"

echo "==> Done."
