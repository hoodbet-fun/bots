# hoodbet.fun bots

Operational bots for PoolTogether V5 on **Robinhood Chain (4663)**.

| Bot | Command | What it does |
|-----|---------|--------------|
| **draw** | `npm run draw` | `startDraw` → RNG → `fulfillRandomness` → `finishDraw` |
| **liquidation** | `npm run liquidation` | Harvest Morpho fees + TPDA yield swap → prize pool |
| **claim** | `npm run claim` | Scan subgraph + `isWinner`, claim prizes for users (bot earns fee) |

Watch mode (continuous polling):

```bash
npm run liquidation:watch
npm run claim:watch
```

## Setup

```bash
cd services/bots
npm install
cp .env.example .env
# Set BOT_PRIVATE_KEY on the VPS only — see scripts/init-bot-wallet.sh
```

**Never commit `.env` or private keys.** `.gitignore` blocks them; run `./scripts/check-no-secrets.sh` before push.

For **liquidation**, the bot wallet also needs **USDG** when a profitable auction is available (pays tokenIn, receives yield tokenOut).

## Run locally

```bash
npm run draw
npm run liquidation
npm run claim
npm run harvest    # Morpho fee harvest only
```

## Production (PM2)

Recommended — use the ecosystem file (loads `.env` via dotenv in each bot):

```bash
cd services/bots
cp .env.example .env   # BOT_PRIVATE_KEY=0x...
npm install
pm2 start ecosystem.config.cjs
pm2 logs
pm2 save
pm2 startup   # follow printed command so bots survive reboot
```

Or one-liner bootstrap on a fresh VPS:

```bash
curl -fsSL https://raw.githubusercontent.com/hoodbet-fun/bots/main/scripts/vps-bootstrap.sh | bash
# then edit ~/hoodbet-bots/.env and pm2 start ecosystem.config.cjs
```

Manual start:

```bash
npm run liquidation:watch
npm run claim:watch
```

Draw bot (cron hourly — first useful after 20 Jul 2026):

```bash
pm2 start ecosystem.config.cjs --only hoodbet-draw
```

## Bot logic

### Draw bot

Runs only when `canStartDraw() == true` (first draw opens **20 Jul 2026**). HoodRngBlockhash needs 5 blocks after `requestRandomness`.

### Liquidation bot

Each cycle:

1. **`HoodFeeHarvester.harvest()`** — redeems Morpho fee shares → PrizePool (no-op if zero shares)
2. Read **`maxAmountOut()`** on TPDA pair `0x8d1877…`
3. If yield available and `maxAmountOut > computeExactAmountIn` (profitable), **`TpdaLiquidationRouter.swapExactAmountOut`**

Currently `maxAmountOut = 0` — normal with ~$0.50 TVL until more deposits + yield accrues.

### Claim bot

1. Requires `getLastAwardedDrawId > 0`
2. Loads depositor addresses from **subgraph**
3. For each, scans `PrizePool.isWinner(vault, user, tier, index)`
4. Calls **`Claimer.claimPrizes`** with `_feeRecipient = bot wallet`

Users can also claim from the app; the bot earns the claim reward.

## Addresses

| | |
|---|---|
| PrizeVault | `0x11da9bE66d20328c6eA16d52079890322fA90f24` |
| Liquidation pair | `0x8d1877D32eF88DFb98059d1eE50EFCB68094B772` |
| Liquidation router | `0xed291bd7ab47d82361f0cbdacbbae0347c530184` |
| HoodFeeHarvester | `0x7FB9C432e78101a6bB59e681458888acaA3db532` |
| PrizePool | `0x14E5004A757A85439Fc379C8AcD5b3b3CDF47344` |
| DrawManager | `0xd1c3d3b690c9a2033b0bea03ba0771847fd983eb` |
| Claimer | `0x71ec0971e8f8e35568a4bbe0fc118e6ca0ebe707` |

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `canStartDraw = false` | Wait until draw period elapses |
| `maxAmountOut = 0` | More TVL + time for Morpho yield |
| `need X tokenIn` | Fund bot wallet with USDG for liquidation |
| Claim finds nothing | No awarded draws yet |
| Subgraph error | Check `SUBGRAPH_URL` |
