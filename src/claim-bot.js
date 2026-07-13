import 'dotenv/config'
import { createPublicClient, createWalletClient, http, parseAbi } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

const robinhood = {
  id: 4663,
  name: 'Robinhood Chain',
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: [process.env.RH_RPC_URL || 'https://rpc.mainnet.chain.robinhood.com'] } },
}

const claimerAbi = parseAbi([
  'function claimPrizes(address vault, address winner, uint8 tier, uint32 prizeIndex) external returns (uint256)',
])

export async function runClaimBot() {
  const account = privateKeyToAccount(process.env.BOT_PRIVATE_KEY)
  const publicClient = createPublicClient({ chain: robinhood, transport: http() })
  const walletClient = createWalletClient({ account, chain: robinhood, transport: http() })

  const claimerAddress = process.env.CLAIMER_ADDRESS
  const subgraphUrl = process.env.SUBGRAPH_URL

  if (!claimerAddress) {
    console.log('[claim-bot] Set CLAIMER_ADDRESS')
    return
  }

  if (subgraphUrl) {
    const res = await fetch(subgraphUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `{ accounts(first: 10, orderBy: balance, orderDirection: desc) { id } }`,
      }),
    })
    const data = await res.json()
    console.log('[claim-bot] Candidates from subgraph', data)
  }

  console.log('[claim-bot] Scanning winners via pt-v5-utils-js / subgraph')
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runClaimBot().catch(console.error)
}
