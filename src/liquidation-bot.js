import 'dotenv/config'
import { createPublicClient, createWalletClient, http, parseAbi } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

const robinhood = {
  id: 4663,
  name: 'Robinhood Chain',
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: [process.env.RH_RPC_URL || 'https://rpc.mainnet.chain.robinhood.com'] } },
}

const liquidatorAbi = parseAbi([
  'function swapExactAmount(uint256 amountOut) external returns (uint256 amountIn)',
])

export async function runLiquidationBot() {
  const account = privateKeyToAccount(process.env.BOT_PRIVATE_KEY)
  const publicClient = createPublicClient({ chain: robinhood, transport: http() })
  const walletClient = createWalletClient({ account, chain: robinhood, transport: http() })

  const pairAddress = process.env.LIQUIDATION_PAIR_ADDRESS
  if (!pairAddress) {
    console.log('[liquidation-bot] Set LIQUIDATION_PAIR_ADDRESS')
    return
  }

  console.log('[liquidation-bot] Monitoring TPDA pair', pairAddress)
  // Poll auction price and execute when profitable
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runLiquidationBot().catch(console.error)
}
