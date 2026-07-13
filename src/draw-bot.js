import 'dotenv/config'
import { createPublicClient, createWalletClient, http, parseAbi } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

const robinhood = {
  id: 4663,
  name: 'Robinhood Chain',
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: [process.env.RH_RPC_URL || 'https://rpc.mainnet.chain.robinhood.com'] } },
}

const rngAbi = parseAbi([
  'function requestRandomness() external returns (uint32)',
  'function fulfillRandomness(uint32 requestId) external',
  'function isRequestComplete(uint32 requestId) external view returns (bool)',
])

const drawManagerAbi = parseAbi([
  'function startDraw() external',
  'function finishDraw() external',
])

export async function runDrawBot() {
  const account = privateKeyToAccount(process.env.BOT_PRIVATE_KEY)
  const publicClient = createPublicClient({ chain: robinhood, transport: http() })
  const walletClient = createWalletClient({ account, chain: robinhood, transport: http() })

  const rngAddress = process.env.HOOD_RNG_ADDRESS
  const drawManagerAddress = process.env.DRAW_MANAGER_ADDRESS

  if (!rngAddress || !drawManagerAddress) {
    console.log('[draw-bot] Set HOOD_RNG_ADDRESS and DRAW_MANAGER_ADDRESS')
    return
  }

  console.log('[draw-bot] Starting draw sequence...')
  const { request: startReq } = await publicClient.simulateContract({
    address: drawManagerAddress,
    abi: drawManagerAbi,
    functionName: 'startDraw',
    account,
  })
  await walletClient.writeContract(startReq)

  const hash = await walletClient.writeContract({
    address: rngAddress,
    abi: rngAbi,
    functionName: 'requestRandomness',
  })
  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  // Parse requestId from logs in production

  console.log('[draw-bot] Waiting for RNG delay...')
  await new Promise((r) => setTimeout(r, 60_000))

  // fulfill + finishDraw — wire requestId from events
  console.log('[draw-bot] Draw cycle initiated', receipt.transactionHash)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runDrawBot().catch(console.error)
}
