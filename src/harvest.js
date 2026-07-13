import { addresses } from './config.js'
import { getPublicClient, getWalletClient } from './clients.js'
import { harvesterAbi } from './abis.js'

/** Redeem Morpho fee shares held by HoodFeeHarvester and contribute to PrizePool. */
export async function runHarvesterIfNeeded() {
  const publicClient = getPublicClient()
  const { account, client: walletClient } = getWalletClient()

  try {
    const { request } = await publicClient.simulateContract({
      address: addresses.hoodFeeHarvester,
      abi: harvesterAbi,
      functionName: 'harvest',
      account,
    })
    const hash = await walletClient.writeContract(request)
    const receipt = await publicClient.waitForTransactionReceipt({ hash })
    console.log('[harvest] Morpho fees contributed, tx', receipt.transactionHash)
    return true
  } catch (err) {
    const msg = err?.shortMessage || err?.message || String(err)
    if (/ZeroShares|zero shares/i.test(msg)) {
      console.log('[harvest] no Morpho fee shares to redeem')
      return false
    }
    if (/PrizeVaultNotSet/i.test(msg)) {
      console.log('[harvest] harvester prizeVault not set')
      return false
    }
    throw err
  }
}
