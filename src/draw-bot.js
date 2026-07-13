import { parseAbiItem } from 'viem'
import { addresses, botPrivateKey, rngBlockDelay } from './config.js'
import { getPublicClient, getWalletClient } from './clients.js'
import { drawManagerAbi, rngAbi } from './abis.js'

const randomnessRequestedEvent = parseAbiItem(
  'event RandomnessRequested(uint32 indexed requestId, uint256 atBlock)',
)

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function waitForBlocks(publicClient, count) {
  const start = await publicClient.getBlockNumber()
  while ((await publicClient.getBlockNumber()) - start < BigInt(count)) {
    await sleep(2000)
  }
}

export async function runDrawBot() {
  if (!botPrivateKey) {
    console.log('[draw-bot] Set BOT_PRIVATE_KEY in .env')
    return
  }

  const publicClient = getPublicClient()
  const { account, client: walletClient } = getWalletClient()

  const canStart = await publicClient.readContract({
    address: addresses.drawManager,
    abi: drawManagerAbi,
    functionName: 'canStartDraw',
  })
  if (!canStart) {
    console.log('[draw-bot] canStartDraw=false — draw period not ready yet')
    return
  }

  console.log('[draw-bot] startDraw...')
  const { request: startReq } = await publicClient.simulateContract({
    address: addresses.drawManager,
    abi: drawManagerAbi,
    functionName: 'startDraw',
    account,
  })
  const startHash = await walletClient.writeContract(startReq)
  await publicClient.waitForTransactionReceipt({ hash: startHash })
  console.log('[draw-bot] startDraw tx', startHash)

  console.log('[draw-bot] requestRandomness...')
  const { request: rngReq } = await publicClient.simulateContract({
    address: addresses.hoodRng,
    abi: rngAbi,
    functionName: 'requestRandomness',
    account,
  })
  const rngHash = await walletClient.writeContract(rngReq)
  const rngReceipt = await publicClient.waitForTransactionReceipt({ hash: rngHash })

  const rngLog = rngReceipt.logs.find(
    (log) => log.address.toLowerCase() === addresses.hoodRng.toLowerCase(),
  )
  if (!rngLog) {
    console.log('[draw-bot] could not parse requestId from logs')
    return
  }

  const decoded = publicClient.decodeEventLog({
    abi: [randomnessRequestedEvent],
    data: rngLog.data,
    topics: rngLog.topics,
  })
  const requestId = decoded.args.requestId
  console.log('[draw-bot] requestId', requestId, 'tx', rngHash)

  console.log(`[draw-bot] waiting ${rngBlockDelay} blocks...`)
  await waitForBlocks(publicClient, rngBlockDelay)

  console.log('[draw-bot] fulfillRandomness...')
  const { request: fulfillReq } = await publicClient.simulateContract({
    address: addresses.hoodRng,
    abi: rngAbi,
    functionName: 'fulfillRandomness',
    args: [requestId],
    account,
  })
  const fulfillHash = await walletClient.writeContract(fulfillReq)
  await publicClient.waitForTransactionReceipt({ hash: fulfillHash })
  console.log('[draw-bot] fulfill tx', fulfillHash)

  const canFinish = await publicClient.readContract({
    address: addresses.drawManager,
    abi: drawManagerAbi,
    functionName: 'canFinishDraw',
  })
  if (!canFinish) {
    console.log('[draw-bot] canFinishDraw=false after RNG')
    return
  }

  console.log('[draw-bot] finishDraw...')
  const { request: finishReq } = await publicClient.simulateContract({
    address: addresses.drawManager,
    abi: drawManagerAbi,
    functionName: 'finishDraw',
    account,
  })
  const finishHash = await walletClient.writeContract(finishReq)
  await publicClient.waitForTransactionReceipt({ hash: finishHash })
  console.log('[draw-bot] draw complete', finishHash)
}

runDrawBot().catch((err) => {
  console.error('[draw-bot]', err?.shortMessage || err?.message || err)
  process.exit(1)
})
