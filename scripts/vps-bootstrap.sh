#!/usr/bin/env bash
# One-time VPS bootstrap for hoodbet bots.
# Run on the server as a user with pm2 installed.
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/hoodbet-fun/bots.git}"
INSTALL_DIR="${INSTALL_DIR:-$HOME/hoodbet-bots}"

echo "==> Installing to $INSTALL_DIR"
if [[ -d "$INSTALL_DIR/.git" ]]; then
  git -C "$INSTALL_DIR" pull --ff-only
else
  git clone "$REPO_URL" "$INSTALL_DIR"
fi

cd "$INSTALL_DIR"
npm ci 2>/dev/null || npm install

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo ""
  echo "EDIT .env and set BOT_PRIVATE_KEY, then run:"
  echo "  pm2 start ecosystem.config.cjs"
  echo "  pm2 save"
  exit 0
fi

pm2 start ecosystem.config.cjs
pm2 save
echo "Done. Check: pm2 logs hoodbet-liquidation --lines 30"
