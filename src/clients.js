import { createPublicClient, createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { botPrivateKey, robinhood } from './config.js'

export function getPublicClient() {
  return createPublicClient({ chain: robinhood, transport: http() })
}

export function getWalletClient() {
  if (!botPrivateKey) throw new Error('BOT_PRIVATE_KEY not set')
  const account = privateKeyToAccount(botPrivateKey)
  return {
    account,
    client: createWalletClient({ account, chain: robinhood, transport: http() }),
  }
}
