import 'server-only'
import { registry } from '../app.config'
import { evmCoinType } from '../lib/validation'
import type { PublicConfig } from '../lib/types'

export interface Config extends PublicConfig {
  apiKey: string | undefined
  sepoliaRpc: string
}

// Fail closed: with a live API key in the environment, a typo'd PARENT_NAME must not issue names elsewhere.
export function assertAllowedParent(parent: string | undefined, allowed = registry.allowedParents): void {
  if (!parent || allowed === null) return
  if (!allowed.includes(parent.toLowerCase()))
    throw new Error(`PARENT_NAME "${parent}" is not in registry.allowedParents (app.config.ts)`)
}

// Shared server-side config. Read lazily so `next build` works without env vars.
export function getConfig(): Config {
  const chainId = Number(process.env.HUMANODE_CHAIN_ID || 14853)
  const parent = process.env.PARENT_NAME?.toLowerCase()
  assertAllowedParent(parent)
  return {
    apiKey: process.env.NAMESPACE_API_KEY,
    parent,
    productionParent: registry.productionParent,
    sepoliaRpc: process.env.SEPOLIA_RPC || 'https://ethereum-sepolia-rpc.publicnode.com',
    chainId,
    chainIdHex: `0x${chainId.toString(16)}`,
    coinType: evmCoinType(chainId),
    rpc: process.env.HUMANODE_RPC || 'https://explorer-rpc-http.testnet5.stages.humanode.io',
    symbol: process.env.HUMANODE_SYMBOL || 'eHMND',
  }
}

export function toPublicConfig(c: Config): PublicConfig {
  return {
    parent: c.parent,
    productionParent: c.productionParent,
    chainId: c.chainId,
    chainIdHex: c.chainIdHex,
    coinType: c.coinType,
    rpc: c.rpc,
    symbol: c.symbol,
  }
}
