import 'dotenv/config'

export const robinhood = {
  id: 4663,
  name: 'Robinhood Chain',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.RH_RPC_URL || 'https://rpc.mainnet.chain.robinhood.com'] },
  },
}

export const addresses = {
  usdg: process.env.USDG_ADDRESS || '0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168',
  hoodRng: process.env.HOOD_RNG_ADDRESS || '0x8B6EdfeCe14210eCb2A8D28F333D81621103Dd19',
  drawManager: process.env.DRAW_MANAGER_ADDRESS || '0xd1c3d3b690c9a2033b0bea03ba0771847fd983eb',
  prizePool: process.env.PRIZE_POOL_ADDRESS || '0x14e5004a757a85439fc379c8acd5b3b3cdf47344',
  prizeVault: process.env.PRIZE_VAULT_ADDRESS || '0x11da9bE66d20328c6eA16d52079890322fA90f24',
  hoodFeeHarvester: process.env.HOOD_FEE_HARVESTER_ADDRESS || '0x7FB9C432e78101a6bB59e681458888acaA3db532',
  liquidationPair: process.env.LIQUIDATION_PAIR_ADDRESS || '0x8d1877D32eF88DFb98059d1eE50EFCB68094B772',
  liquidationRouter: process.env.LIQUIDATION_ROUTER_ADDRESS || '0xed291bd7ab47d82361f0cbdacbbae0347c530184',
  claimer: process.env.CLAIMER_ADDRESS || '0x71ec0971e8f8e35568a4bbe0fc118e6ca0ebe707',
}

export const subgraphUrl =
  process.env.SUBGRAPH_URL ||
  'https://api.goldsky.com/api/public/project_cmmaz8bs32rjv01u29b8y8vuf/subgraphs/hoodbet/1.0.0/gn'

export const botPrivateKey = process.env.BOT_PRIVATE_KEY

export const liquidationPollMs = Number(process.env.LIQUIDATION_POLL_MS || 30_000)
export const claimPollMs = Number(process.env.CLAIM_POLL_MS || 60_000)
export const rngBlockDelay = Number(process.env.RNG_BLOCK_DELAY || 6)
export const numberOfTiers = Number(process.env.NUMBER_OF_TIERS || 4)
export const maxPrizeIndexScan = Number(process.env.MAX_PRIZE_INDEX_SCAN || 8)
export const liquidationWatch = process.env.LIQUIDATION_WATCH === 'true'
export const claimWatch = process.env.CLAIM_WATCH === 'true'
