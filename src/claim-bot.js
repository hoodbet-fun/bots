import {
  addresses,
  botPrivateKey,
  claimPollMs,
  claimWatch,
  maxPrizeIndexScan,
  numberOfTiers,
} from './config.js'
import { getPublicClient, getWalletClient } from './clients.js'
import { claimerAbi, prizePoolAbi } from './abis.js'
import { fetchRecentWinnerAddresses, fetchVaultAccounts } from './subgraph.js'

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function findUnclaimedWins(publicClient, vault, user) {
  const wins = []
  for (let tier = 0; tier < numberOfTiers; tier++) {
    for (let prizeIndex = 0; prizeIndex < maxPrizeIndexScan; prizeIndex++) {
      let won = false
      try {
        won = await publicClient.readContract({
          address: addresses.prizePool,
          abi: prizePoolAbi,
          functionName: 'isWinner',
          args: [vault, user, tier, prizeIndex],
        })
      } catch {
        break
      }
      if (won) wins.push({ tier, prizeIndex })
    }
  }
  return wins
}

async function claimForUser(publicClient, walletClient, account, vault, user, wins) {
  const byTier = wins.reduce((acc, w) => {
    if (!acc[w.tier]) acc[w.tier] = []
    acc[w.tier].push(w.prizeIndex)
    return acc
  }, {})

  let totalClaimed = 0n

  for (const [tierStr, indices] of Object.entries(byTier)) {
    const tier = Number(tierStr)
    const { request } = await publicClient.simulateContract({
      address: addresses.claimer,
      abi: claimerAbi,
      functionName: 'claimPrizes',
      args: [vault, tier, [user], [indices], account.address, 0n],
      account,
    })
    const hash = await walletClient.writeContract(request)
    const receipt = await publicClient.waitForTransactionReceipt({ hash })
    totalClaimed += 1n
    console.log(
      '[claim-bot] claimed tier',
      tier,
      'for',
      user,
      'indices',
      indices.join(','),
      'tx',
      receipt.transactionHash,
    )
  }

  return totalClaimed
}

export async function runClaimCycle() {
  if (!botPrivateKey) {
    console.log('[claim-bot] Set BOT_PRIVATE_KEY in .env')
    return
  }

  const publicClient = getPublicClient()
  const { account, client: walletClient } = getWalletClient()
  const vault = addresses.prizeVault

  const lastAwarded = await publicClient.readContract({
    address: addresses.prizePool,
    abi: prizePoolAbi,
    functionName: 'getLastAwardedDrawId',
  })

  if (lastAwarded === 0) {
    console.log('[claim-bot] no awarded draws yet')
    return
  }

  console.log('[claim-bot] scanning winners for draw(s) up to', lastAwarded.toString())

  let candidates = []
  try {
    const [depositors, winners] = await Promise.all([
      fetchVaultAccounts(100),
      fetchRecentWinnerAddresses(50),
    ])
    candidates = [...new Set([...depositors, ...winners])]
  } catch (err) {
    console.log('[claim-bot] subgraph unavailable, skipping scan:', err.message)
    return
  }

  if (candidates.length === 0) {
    console.log('[claim-bot] no candidate addresses from subgraph')
    return
  }

  let claims = 0

  for (const user of candidates) {
    const wins = await findUnclaimedWins(publicClient, vault, user)
    if (wins.length === 0) continue

    console.log('[claim-bot] found', wins.length, 'unclaimed prize(s) for', user)
    await claimForUser(publicClient, walletClient, account, vault, user, wins)
    claims += wins.length
  }

  if (claims === 0) {
    console.log('[claim-bot] no unclaimed prizes found')
  } else {
    console.log('[claim-bot] processed', claims, 'prize claim(s)')
  }
}

export async function runClaimBot() {
  if (claimWatch) {
    console.log('[claim-bot] watch mode, poll every', claimPollMs, 'ms')
    for (;;) {
      try {
        await runClaimCycle()
      } catch (err) {
        console.error('[claim-bot]', err?.shortMessage || err?.message || err)
      }
      await sleep(claimPollMs)
    }
  }

  await runClaimCycle()
}

runClaimBot().catch((err) => {
  console.error('[claim-bot]', err?.shortMessage || err?.message || err)
  process.exit(1)
})
