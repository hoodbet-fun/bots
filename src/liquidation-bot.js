import { maxUint256 } from 'viem'
import {
  addresses,
  botPrivateKey,
  liquidationPollMs,
  liquidationWatch,
} from './config.js'
import { getPublicClient, getWalletClient } from './clients.js'
import { erc20Abi, liquidationPairAbi, liquidationRouterAbi } from './abis.js'
import { runHarvesterIfNeeded } from './harvest.js'

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function getUsdgBalance(publicClient, account) {
  return publicClient.readContract({
    address: addresses.usdg,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [account.address],
  })
}

async function ensureAllowance(publicClient, walletClient, account, token, spender, needed) {
  const allowance = await publicClient.readContract({
    address: token,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [account.address, spender],
  })
  if (allowance >= needed) return

  const { request } = await publicClient.simulateContract({
    address: token,
    abi: erc20Abi,
    functionName: 'approve',
    args: [spender, maxUint256],
    account,
  })
  const hash = await walletClient.writeContract(request)
  await publicClient.waitForTransactionReceipt({ hash })
  console.log('[liquidation-bot] approved tokenIn for router', hash)
}

/** @returns {'ok' | 'paused' | 'missing-key'} */
export async function runLiquidationCycle() {
  if (!botPrivateKey) {
    console.log('[liquidation-bot] Set BOT_PRIVATE_KEY in .env')
    return 'missing-key'
  }

  const publicClient = getPublicClient()
  const { account, client: walletClient } = getWalletClient()
  const pair = addresses.liquidationPair
  const router = addresses.liquidationRouter

  // Morpho fee harvest only needs ETH for gas — always try before swap logic.
  await runHarvesterIfNeeded()

  const usdgBalance = await getUsdgBalance(publicClient, account)
  if (usdgBalance === 0n) {
    return 'paused'
  }

  const [maxOut, tokenIn, tokenOut, amountIn] = await Promise.all([
    publicClient.readContract({
      address: pair,
      abi: liquidationPairAbi,
      functionName: 'maxAmountOut',
    }),
    publicClient.readContract({
      address: pair,
      abi: liquidationPairAbi,
      functionName: 'tokenIn',
    }),
    publicClient.readContract({
      address: pair,
      abi: liquidationPairAbi,
      functionName: 'tokenOut',
    }),
    publicClient.readContract({
      address: pair,
      abi: liquidationPairAbi,
      functionName: 'computeExactAmountIn',
      args: [1n],
    }),
  ])

  console.log('[liquidation-bot] pair', pair)
  console.log('[liquidation-bot] maxAmountOut', maxOut.toString(), 'auction price (tokenIn)', amountIn.toString())

  if (maxOut === 0n) {
    console.log('[liquidation-bot] no yield to liquidate yet — need vault TVL + time')
    return 'ok'
  }

  if (amountIn === 0n || amountIn >= maxOut) {
    console.log('[liquidation-bot] swap not profitable at current auction price')
    return 'ok'
  }

  const tokenInBalance = await publicClient.readContract({
    address: tokenIn,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [account.address],
  })

  if (tokenInBalance < amountIn) {
    console.log(
      `[liquidation-bot] need ${amountIn} tokenIn (${tokenIn}), wallet has ${tokenInBalance}`,
    )
    return 'ok'
  }

  await ensureAllowance(publicClient, walletClient, account, tokenIn, router, amountIn)

  const deadline = BigInt(Math.floor(Date.now() / 1000) + 600)

  const { request } = await publicClient.simulateContract({
    address: router,
    abi: liquidationRouterAbi,
    functionName: 'swapExactAmountOut',
    args: [pair, account.address, maxOut, amountIn, deadline],
    account,
  })

  const hash = await walletClient.writeContract(request)
  const receipt = await publicClient.waitForTransactionReceipt({ hash })

  const profit = maxOut - amountIn
  console.log(
    '[liquidation-bot] swapped',
    maxOut.toString(),
    'tokenOut',
    tokenOut,
    'for',
    amountIn.toString(),
    'tokenIn',
    tokenIn,
    '| est. profit',
    profit.toString(),
    'USDG | tx',
    receipt.transactionHash,
  )
  return 'ok'
}

export async function runLiquidationBot() {
  if (liquidationWatch) {
    console.log('[liquidation-bot] watch mode, poll every', liquidationPollMs, 'ms')
    let paused = false
    for (;;) {
      try {
        const status = await runLiquidationCycle()
        if (status === 'paused') {
          if (!paused) {
            console.log(
              '[liquidation-bot] swap paused — wallet has 0 USDG; harvest still runs each cycle',
            )
            paused = true
          }
        } else if (paused) {
          console.log('[liquidation-bot] resumed — USDG detected in wallet')
          paused = false
        }
      } catch (err) {
        console.error('[liquidation-bot]', err?.shortMessage || err?.message || err)
      }
      await sleep(liquidationPollMs)
    }
  }

  await runLiquidationCycle()
}

runLiquidationBot().catch((err) => {
  console.error('[liquidation-bot]', err?.shortMessage || err?.message || err)
  process.exit(1)
})
