#!/usr/bin/env bash
# Generate a fresh bot wallet ON THIS MACHINE and store the key only in .env (chmod 600).
# Never commit .env. Fund the printed address with ETH (+ USDG later for liquidation).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT/.env}"
EXAMPLE="$ROOT/.env.example"

if [[ -f "$ENV_FILE" ]] && grep -q '^BOT_PRIVATE_KEY=0x[0-9a-fA-F]\{64\}$' "$ENV_FILE" 2>/dev/null; then
  echo "ERROR: $ENV_FILE already has BOT_PRIVATE_KEY set."
  echo "Delete the line or remove .env to generate a new wallet."
  exit 1
fi

if ! command -v node >/dev/null; then
  echo "ERROR: node required"
  exit 1
fi

read -r ADDRESS PRIVATE_KEY <<< "$(node --input-type=module -e "
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
const pk = generatePrivateKey()
const account = privateKeyToAccount(pk)
process.stdout.write(account.address + ' ' + pk)
")"

# Build .env from example if missing
if [[ ! -f "$ENV_FILE" ]]; then
  cp "$EXAMPLE" "$ENV_FILE"
fi

if grep -q '^BOT_PRIVATE_KEY=' "$ENV_FILE"; then
  sed -i.bak "s|^BOT_PRIVATE_KEY=.*|BOT_PRIVATE_KEY=$PRIVATE_KEY|" "$ENV_FILE"
  rm -f "$ENV_FILE.bak"
else
  printf '\nBOT_PRIVATE_KEY=%s\n' "$PRIVATE_KEY" >> "$ENV_FILE"
fi

chmod 600 "$ENV_FILE"

# Clear shell variable
unset PRIVATE_KEY

echo ""
echo "=============================================="
echo "  HoodBet bot wallet created (local only)"
echo "=============================================="
echo "  Address:  $ADDRESS"
echo "  Key file: $ENV_FILE (mode 600)"
echo ""
echo "  NEXT: send ETH on Robinhood Chain (4663) to the address above."
echo "        ~0.02 ETH is enough to start. Add USDG later for liquidation."
echo ""
echo "  NEVER paste the private key in chat, git, or Discord."
echo "  To view address again: grep BOT_PRIVATE_KEY is wrong — use:"
echo "    cast wallet address --private-key \$(grep BOT_PRIVATE_KEY .env | cut -d= -f2)"
echo "=============================================="
echo ""
