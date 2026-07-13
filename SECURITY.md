# VPS security checklist — hoodbet bots

## What you do NOT need to give anyone

- **Private key** — generated on the VPS, never sent to chat/GitHub/Discord
- **Safe keys** — bot wallet is separate from Safe `0x5FF9…`
- **Your personal wallet key**

## What you need

1. **A VPS** you control (Hetzner, DigitalOcean, AWS, etc.) with SSH login
2. **ETH on Robinhood Chain** sent to the **public bot address** (after `init-bot-wallet.sh` prints it)

You do **not** need to give me SSH or any account. Run the commands yourself on the server.

## Setup (on the VPS only)

```bash
git clone https://github.com/hoodbet-fun/bots.git ~/hoodbet-bots
cd ~/hoodbet-bots
npm install
chmod +x scripts/init-bot-wallet.sh
./scripts/init-bot-wallet.sh
```

Script prints **address only**. Fund that address from any wallet (MetaMask, Robinhood, etc.).

Then:

```bash
pm2 start ecosystem.config.cjs
pm2 save && pm2 startup
```

## Hardening (recommended)

```bash
# Dedicated linux user (not root)
sudo adduser hoodbet --disabled-password
sudo usermod -aG sudo hoodbet   # optional

# Firewall: only SSH
sudo ufw allow OpenSSH
sudo ufw enable

# SSH: key-only, no password
# In /etc/ssh/sshd_config: PasswordAuthentication no
sudo systemctl restart sshd

# Bot files owned by hoodbet user
chown -R hoodbet:hoodbet ~/hoodbet-bots
chmod 600 ~/hoodbet-bots/.env
```

Optional extras:
- **Fail2ban** for SSH brute force
- **No inbound ports** except SSH (bots only make outbound RPC calls)
- **Separate machine** from anything else you run
- **Hardware wallet / multisig** not needed for bot — it's a hot wallet with limited funds

## If the VPS is compromised

Attacker could steal **only** what's on the bot wallet (ETH + USDG). They cannot:
- Move Safe funds
- Change Morpho curator settings (Safe is curator)
- Drain user deposits in HoodPot

Keep **low balance** on bot: top up ETH periodically, not a large USDG stash.

## Git — never push secrets

- `.env` is in `.gitignore` — only `.env.example` (no real keys) may be committed
- Run `./scripts/check-no-secrets.sh` before every `git push`
- Bot private key: create with `./scripts/init-bot-wallet.sh` on the VPS only
- If any API key or private key was ever committed: **rotate it** on the provider (Goldsky, etc.) — git history may still contain it

## Rotating the bot key

```bash
pm2 stop all
rm .env
./scripts/init-bot-wallet.sh
# fund new address, drain old wallet if needed
pm2 start ecosystem.config.cjs
```
