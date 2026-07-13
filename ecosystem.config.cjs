/** PM2 ecosystem — hoodbet.fun bots on Robinhood Chain (4663)
 *
 * Usage (from services/bots/):
 *   cp .env.example .env   # set BOT_PRIVATE_KEY
 *   npm install
 *   pm2 start ecosystem.config.cjs
 *   pm2 save && pm2 startup
 */
module.exports = {
  apps: [
    {
      name: 'hoodbet-liquidation',
      script: 'src/liquidation-bot.js',
      cwd: __dirname,
      interpreter: 'node',
      env: {
        NODE_ENV: 'production',
        LIQUIDATION_WATCH: 'true',
        LIQUIDATION_POLL_MS: '30000',
      },
      autorestart: true,
      max_restarts: 50,
      restart_delay: 5000,
    },
    {
      name: 'hoodbet-claim',
      script: 'src/claim-bot.js',
      cwd: __dirname,
      interpreter: 'node',
      env: {
        NODE_ENV: 'production',
        CLAIM_WATCH: 'true',
        CLAIM_POLL_MS: '60000',
      },
      autorestart: true,
      max_restarts: 50,
      restart_delay: 5000,
    },
    {
      name: 'hoodbet-draw',
      script: 'src/draw-bot.js',
      cwd: __dirname,
      interpreter: 'node',
      cron_restart: '0 * * * *',
      autorestart: false,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
}
