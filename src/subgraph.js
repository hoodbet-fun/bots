import { addresses, subgraphUrl } from './config.js'

async function gql(query, variables = {}) {
  const res = await fetch(subgraphUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  })
  if (!res.ok) throw new Error(`Subgraph HTTP ${res.status}`)
  const json = await res.json()
  if (json.errors?.length) throw new Error(json.errors[0].message)
  return json.data
}

/** Accounts with TWAB balance on the HoodPot vault (depositors). */
export async function fetchVaultAccounts(first = 100) {
  const vault = addresses.prizeVault.toLowerCase()
  const data = await gql(
    `query VaultAccounts($vault: Bytes!, $first: Int!) {
      accounts(
        first: $first
        orderBy: balance
        orderDirection: desc
        where: { prizeVault: $vault, balance_gt: "0" }
      ) {
        user { address }
        balance
      }
    }`,
    { vault, first },
  )
  return (data.accounts ?? []).map((a) => a.user.address)
}

/** Addresses that won prizes in indexed draws (may still be unclaimed on-chain). */
export async function fetchRecentWinnerAddresses(first = 50) {
  const vault = addresses.prizeVault.toLowerCase()
  const data = await gql(
    `query RecentWinners($vault: Bytes!, $first: Int!) {
      prizeClaims(
        first: $first
        orderBy: timestamp
        orderDirection: desc
        where: { prizeVault: $vault }
      ) {
        winner
      }
    }`,
    { vault, first },
  )
  const winners = (data.prizeClaims ?? []).map((c) => c.winner)
  return [...new Set(winners)]
}
